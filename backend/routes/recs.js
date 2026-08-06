const express = require("express");
const router = express.Router();
const Rec = require("../models/Rec");
const axios = require("axios");

router.get("/og-image", async (req, res) => {
    try {
        const { url } = req.query;
        const response = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });
        const html = response.data;
        const match = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        res.json({ imageUrl: match ? match[1] : null });
    } catch {
        res.json({ imageUrl: null });
    }
});
router.get("/", async (req, res) => {
    const data = await Rec.find().sort({ createdAt: -1 });
    res.json(data);
});
router.post("/", async (req, res) => {
    const rec = await Rec.create({ name: req.body.name, url: req.body.url, imageUrl: req.body.imageUrl });
    res.json(rec);
});
router.put("/:id", async (req, res) => {
    const rec = await Rec.findByIdAndUpdate(
        req.params.id,
        { name: req.body.name, url: req.body.url, imageUrl: req.body.imageUrl },
        { new: true }
    );
    res.json(rec);
});
router.delete("/:id", async (req, res) => {
    await Rec.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = router;