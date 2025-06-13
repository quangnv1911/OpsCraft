import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './services/authService.js';
import { errorService } from './services/errorService.js';
import usersRouter from './routes/users.js';
import productsRouter from './routes/products.js';
import testRouter from './routes/test.js';
import ciRouter from './routes/ci.js';
import authRouter from './routes/auth.js';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Load environment variables
dotenv.config();
// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files từ thư mục public
app.use(express.static('public'));

// Session middleware (cần cho Passport)
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/test', testRouter);
app.use('/api/ci', ciRouter);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Chào mừng bạn đến với Node.js Express API!',
        status: 'success',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            products: '/api/products',
            test: '/api/test',
            ci: '/api/ci'
        },
        documentation: {
            health: '/health',
            errorTest: '/test-error'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
    });
});

// Test error endpoint (for testing error handling)
app.get('/test-error', (req, res, next) => {
    const type = req.query.type || 'general';

    switch (type) {
        case 'validation':
            next(new errorService.ValidationError('Test validation error', ['field1', 'field2']));
            break;
        case 'auth':
            next(new errorService.AuthenticationError('Test authentication error'));
            break;
        case 'not-found':
            next(new errorService.NotFoundError('Test resource'));
            break;
        case 'async':
            // Test unhandled promise rejection
            Promise.reject(new Error('Test async error'));
            break;
        case 'sync':
            // Test uncaught exception
            process.nextTick(() => {
                throw new Error('Test sync error');
            });
            break;
        default:
            next(new Error('Test general error'));
    }
});

// 404 handler - must be after all routes
app.use(errorService.notFoundHandler());

// Global error handler - must be last middleware
app.use(errorService.expressErrorHandler());

// Start server with error handling
const server = app.listen(PORT, () => {
    console.log('\n🎉 ===============================');
    console.log('🚀 Server started successfully!');
    console.log('================================');
    console.log(`📱 URL: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('================================\n');

    // Check configurations
    console.log('🔧 Configuration Status:');
    console.log(`   Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '⚠️  Not configured'}`);
    console.log(`   JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '⚠️  Using fallback'}`);
    console.log(`   Session Secret: ${process.env.SESSION_SECRET ? '✅ Configured' : '⚠️  Using fallback'}`);
    console.log('================================\n');

    if (!process.env.GOOGLE_CLIENT_ID) {
        console.log('💡 To enable Google OAuth:');
        console.log('   1. Create Google OAuth credentials');
        console.log('   2. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
        console.log('   3. Restart the server\n');
    }
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', error);
        process.exit(1);
    }
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n👋 Received shutdown signal...');
    server.close((err) => {
        if (err) {
            console.error('❌ Error during server shutdown:', err);
            process.exit(1);
        }
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown); 