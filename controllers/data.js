const express = require('express');
const router = express.Router();

module.exports = (notion) => {
    // Define a route for getting all the items
router.get('/items', async (req, res) => {
    console.log('GET /items');
        try {
            const response = await notion.databases.query({
                database_id: '4527c32a2a36428f84d70909fd594e2a',
            });

            console.log(response.results);

            const items = response.results.map((item) => ({
                id: item.id,
                name: item.properties.Name.title[0].text.content,
                price: item.properties.Price.number,
                tags: item.properties.Tags.multi_select.map((tag) => tag.name),
                image: item.properties.Image.files[0].file.url
            }));

            res.json(items);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'An error occurred'
            });
        }
    });
    
    return router;
}