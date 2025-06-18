class TestController {
    constructor() {
        this.service = { name: 'MyService' };
    }

    // Arrow function - THIS WORKS
    arrowMethod = () => {
        console.log('Arrow function this:', this.service?.name); // ✅ "MyService"
    }

    // Regular method - THIS MIGHT FAIL
    regularMethod() {
        console.log('Regular method this:', this.service?.name); // ❌ Could be undefined
    }
}

const controller = new TestController();

// Test 1: Direct call (both work)
console.log('=== Direct call ===');
controller.arrowMethod();    // ✅ Works
controller.regularMethod();  // ✅ Works

// Test 2: Destructured call (arrow works, regular fails)
console.log('=== Destructured call ===');
const { arrowMethod, regularMethod } = controller;
arrowMethod();    // ✅ Still works
regularMethod();  // ❌ Fails - `this` is undefined

// Test 3: Callback simulation (like Express routing)
console.log('=== Callback simulation ===');
function callAsCallback(callback) {
    callback();
}
callAsCallback(controller.arrowMethod);    // ✅ Works
callAsCallback(controller.regularMethod);  // ❌ Fails 