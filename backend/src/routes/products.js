import express from 'express';

const router = express.Router();

// Dữ liệu giả cho products
let products = [
    { id: 1, name: 'Laptop Dell', price: 15000000, category: 'Electronics', stock: 10 },
    { id: 2, name: 'iPhone 15', price: 25000000, category: 'Electronics', stock: 5 },
    { id: 3, name: 'Áo sơ mi', price: 300000, category: 'Fashion', stock: 20 },
    { id: 4, name: 'Giày thể thao', price: 1200000, category: 'Fashion', stock: 15 }
];

// GET /api/products - Lấy danh sách sản phẩm
router.get('/', (req, res) => {
    const { category, minPrice, maxPrice } = req.query;
    let filteredProducts = [...products];

    // Filter by category
    if (category) {
        filteredProducts = filteredProducts.filter(p =>
            p.category.toLowerCase().includes(category.toLowerCase())
        );
    }

    // Filter by price range
    if (minPrice) {
        filteredProducts = filteredProducts.filter(p => p.price >= parseInt(minPrice));
    }

    if (maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice));
    }

    res.json({
        message: 'Lấy danh sách sản phẩm thành công',
        data: filteredProducts,
        total: filteredProducts.length,
        filters: { category, minPrice, maxPrice }
    });
});

// GET /api/products/:id - Lấy thông tin sản phẩm theo ID
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({
            message: 'Không tìm thấy sản phẩm',
            status: 'error'
        });
    }

    res.json({
        message: 'Lấy thông tin sản phẩm thành công',
        data: product
    });
});

// POST /api/products - Tạo sản phẩm mới
router.post('/', (req, res) => {
    const { name, price, category, stock } = req.body;

    if (!name || !price || !category) {
        return res.status(400).json({
            message: 'Tên, giá và danh mục sản phẩm là bắt buộc',
            status: 'error'
        });
    }

    const newProduct = {
        id: products.length + 1,
        name,
        price: parseInt(price),
        category,
        stock: stock || 0
    };

    products.push(newProduct);

    res.status(201).json({
        message: 'Tạo sản phẩm thành công',
        data: newProduct
    });
});

// PUT /api/products/:id - Cập nhật sản phẩm
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({
            message: 'Không tìm thấy sản phẩm',
            status: 'error'
        });
    }

    const { name, price, category, stock } = req.body;

    products[productIndex] = {
        ...products[productIndex],
        ...(name && { name }),
        ...(price && { price: parseInt(price) }),
        ...(category && { category }),
        ...(stock !== undefined && { stock: parseInt(stock) })
    };

    res.json({
        message: 'Cập nhật sản phẩm thành công',
        data: products[productIndex]
    });
});

// DELETE /api/products/:id - Xóa sản phẩm
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({
            message: 'Không tìm thấy sản phẩm',
            status: 'error'
        });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];

    res.json({
        message: 'Xóa sản phẩm thành công',
        data: deletedProduct
    });
});

export default router; 