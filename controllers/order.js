const express = require('express');
const router = express.Router();

module.exports = (notion, sendAlertEmail) => {
    // Define a route for creating a new order
    router.post('/create', async (req, res) => {
        console.log('POST /orders');
        try {
            const {
                firstName,
                lastName,
                address,
                email,
                phone,
                items,
                comments
            } = req.body;

            // Create a new order in the Orders database
            const order = await notion.pages.create({
                parent: {
                    database_id: 'b84feafabe754fa09f3fae9bd7a0a1ad',
                },
                properties: {
                    'First Name': {
                        rich_text: [{
                            type: "text",
                            text: {
                                content: firstName,
                            },
                        }, ],
                    },
                    'Last Name': {
                        rich_text: [{
                            type: "text",
                            text: {
                                content: lastName,
                            },
                        }, ],
                    },
                    Address: {
                        rich_text: [{
                            type: "text",
                            text: {
                                content: address,
                            },
                        }, ],
                    },
                    Email: {
                        email: email,
                    },
                    Phone: {
                        phone_number: phone,
                    },
                    Comments: {
                        rich_text: [{
                            type: "text",
                            text: {
                                content: comments,
                            },
                        }, ],
                    },
                },
            });

            // Add the order quantities to the order
            const orderQuantities = [];
            for (const item of items) {
                const orderQuantity = {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        text: [{
                            type: 'text',
                            text: {
                                content: `${item.quantity} x ${item.name}`,
                            },
                        }, ],
                    },
                };
                orderQuantities.push(orderQuantity);

                const orderQuantityTitle = `${item.quantity} x ${item.name}`;
                // Add a new row to the Order Quantities database
                await notion.pages.create({
                    parent: {
                        database_id: '73241d77587c47e8ab2770c2d3a04bf8',
                    },
                    properties: {
                        Item: {
                            relation: [{
                                id: item.id
                            }],
                        },
                        Quantity: {
                            number: Number(item.quantity),
                        },
                        Order: {
                            relation: [{
                                id: order.id
                            }],
                        },
                        Name: {
                            title: [
                                {
                                    type: 'text',
                                    text: {
                                        content: orderQuantityTitle,
                                    },
                                },
                            ],
                        },
                    },
                });
            }

            const orderTitle = `Order for ${firstName} ${lastName}`;

            // Update the order with the number of items and total price
            const response = await notion.pages.update({
                page_id: order.id,
                properties: {
                    Name: {
                        title: [
                            {
                                type: 'text',
                                text: {
                                    content: orderTitle,
                                },
                            },
                        ],
                    },
                },
            });

            sendAlertEmail(req.body, '6094709203@mymetropcs.com', 'developer');
            sendAlertEmail(req.body, '6094709200@mymetropcs.com', 'developer');
            sendAlertEmail(req.body, 'baiken314@gmail.com', 'developer');
            sendAlertEmail(req.body, 'theupholsterer@comcast.net', 'developer');
            sendAlertEmail(req.body, email, 'customer');

            res.json({
                message: 'Order created successfully',
                orderId: response.id
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'An error occurred'
            });
        }
    });

    return router;
}