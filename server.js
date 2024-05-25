require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();

const notion = new Client({
    auth: process.env.NOTION_AUTH,
});

// Create a transporter object with your email service credentials
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Serve static files from the public directory
app.use(express.static('public'));
app.use(bodyParser.json());

// Define a function to send the email
const sendAlertEmail = async (orderData, email, mode='customer') => {
    const response = await notion.databases.query({
        database_id: process.env.DATABASE_ID,
    });

    const itemOptions = response.results.map((item) => ({
        id: item.id,
        name: item.properties.Name.title[0].text.content,
        price: item.properties.Price.number,
        tags: item.properties.Tags.multi_select.map((tag) => tag.name),
    }));

    // Define the email content
    const totalPrice = orderData.items.reduce((acc, item) => {
        const itemPrice = itemOptions.find((option) => option.id === item.id).price;
        return acc + itemPrice * item.quantity;
    }, 0);

    let mailOptions;
    if (mode == 'developer') {
        mailOptions = {
            from: 'DroneDrop609 Alerts',
            to: email,
            subject: `New Order for ${orderData.firstName} ${orderData.lastName}`,
            html: `
                <p>Name: ${orderData.firstName} ${orderData.lastName}</p>
                <p>Deliver to: ${orderData.address}</p>
                <p>${orderData.email} - ${orderData.phone}</p>
                <p>Order:</p>
                <ul>
                    ${orderData.items.map(item => `<li>${item.quantity} x ${item.name}: $${itemOptions.find((option) => option.id === item.id).price.toFixed(2)}</li>`).join('')}
                </ul>
                <p>Additional Comments: ${orderData.comments}</p>
                <p>Total: $${totalPrice.toFixed(2)}</p>
            `
        };
    }

    if (mode == 'customer') {
        mailOptions = {
            from: 'DroneDrop609',
            to: email,
            subject: `Your order has been confirmed! -DroneDrop609`,
            html: `
                <p>Thank you for ordering with Drone Drop 609!</p>
                <p></p>
                <p>Delivering to ${orderData.firstName} ${orderData.lastName} at ${orderData.address}.</p>
                <p>Order:</p>
                <ul>
                    ${orderData.items.map(item => `<li>${item.quantity} x ${item.name}: $${itemOptions.find((option) => option.id === item.id).price.toFixed(2)}</li>`).join('')}
                </ul>
                <p>Total: $${totalPrice.toFixed(2)}</p>
                <p></p>
                <p>Call 609-470-9200 if you have any questions!</p>
            `
        };
    }

    // Send the email
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error(error);
    }
}

const dataRoutes = require('./controllers/data')(notion);
const orderRoutes = require('./controllers/order')(notion, sendAlertEmail);
app.use('/data', dataRoutes);
app.use('/order', orderRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Start the server
app.listen(10000, () => {
    console.log('Server is listening on port 10000');
});
