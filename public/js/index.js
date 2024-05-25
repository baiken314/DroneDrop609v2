let app = new Vue({
    el: '#app',
    data: {
        firstName: '',
        lastName: '',
        address: '',
        email: '',
        phone: '',
        comments: '',
        state: 'itemSelection',
        items: [],
        cart: [],
        maxItems: 5
    },
    computed: {
        totalPrice() {
            return this.cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        },
        // paypalFees() {
        //     return this.totalPrice * 0.05 + 0.5;
        // }
    },
    methods: {
        loadItemData() {
            fetch('/data/items')
                .then(response => response.json())
                .then(data => {
                    this.items = data.reverse();
                    console.log(this.items);
                })
                .catch(error => console.error(error));
        },
        addToCart(item) {
            let inCart = this.cart.find(cartItem => cartItem.id == item.id);
            if (!inCart && this.cart.length < this.maxItems) {
                item.quantity = 1;
                this.cart.push(JSON.parse(JSON.stringify(item)));
            }
        },
        removeFromCart(item) {
            this.cart = this.cart.filter(cartItem => cartItem.id != item.id);
        },
        clampQuantities(remove=false) {
            console.log('clamp quantities');
            for (item of this.cart) {
                if (item.quantity > 10) item.quantity = 1;
                if (item.quantity < 1)  item.quantity = 0;
                item.quantity = parseInt(item.quantity);
            }
            if (remove) this.cart = this.cart.filter(cartItem => cartItem.quantity > 0 && cartItem.quantity <= 10);
        },
        goToCheckout() {
            if (this.cart.length == 0) return;

            this.state = 'checkout';
            this.clampQuantities(true);

            Vue.nextTick(() => {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            });
        },
        loadPaypalButton() {
            let me = this;
            let form = document.getElementById('order-form');

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            this.state = 'payment';
            console.log(this.state);

            Vue.nextTick(() => {
                console.log("loading paypal button...");
                
                paypal.Buttons({    
                    createOrder: function(data, actions) {
                    // Set up the transaction
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: me.totalPrice
                            }
                        }]
                    });
                    },
                    onApprove: function(data, actions) {
                        // Capture the funds from the transaction
                        return actions.order.capture().then(function(details) {
                            // Show a success message to the buyer
                            //alert('Transaction completed by ' + details.payer.name.given_name);
                            me.submitOrder();
                        });
                    }
                }).render('#paypal-button-container');
            });
        },
        async submitOrder() {
            console.log("Submitting order...");
            try {
                this.state = 'paid';
                
                // Create the order data to send to the server
                const orderData = {
                    firstName: this.firstName,
                    lastName: this.lastName,
                    address: this.address,
                    email: this.email,
                    phone: this.phone,
                    items: this.cart,
                    comments: this.comments
                };
                
                console.log(orderData);

                // Send the order data to the server
                const orderResponse = await fetch('/order/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });
                
                // Handle the response from the server
                const orderResult = await orderResponse.json();
                console.log(orderResult);
            } catch (error) {
                console.error(error);
            }
        },
    },
    created() {
        this.loadItemData();
    }
});