const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");

// Require all models
const db = require("../models");
// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/newsComments", { useNewUrlParser: true });


module.exports = function (app) {

  app.get("/api/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://www.foodnetwork.com")
      .then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        const $ = cheerio.load(response.data);
        // Save an empty articles object
        const articles = [];

        // Now, we grab every h2 within an article tag, and do the following:
        // $("div.-Article").each(function (i, element) {
        // $("div.o-StoryPromo__m-StoryCard").each(function (i, element) {
        $("div.m-StoryCard--Article").each(function (i, element) {
          // Add the text and href of every link, and save them as properties of the result object
          const title = $(element).find("a").children("span").text();
          console.log(title);
          console.log("-----------------");
          const link = $(element).find("a").attr("href");
          console.log(link);
          console.log("-----------------");
          const description = $(element).find("div.m-StoryCard__a-Description").text();
          console.log(description);
          console.log("-----------------");
          const byLine = $(element).find("div.m-StoryCard__a-Credit").text().trim();
          console.log(byLine);
          console.log("=====================");

          let newArticle = {
            title,
            link,
            description,
            byLine
          };
          let query = { link: link };
          let options = {
            new: true,
            upsert: true
          };
          console.log("---------------------")
          console.log("scraped data")
          console.log(newArticle)
          // Create a new Article using the `articles` object built from scraping
          db.Article.findOneAndUpdate(query, { $set: newArticle }, options)
            .then(function (dbArticle) {
              // View the added result in the console
              console.log("---------------------")
              console.log("update results")
              console.log(dbArticle);
            })
            .catch(function (err) {
              // If an error occurred, log it
              console.log(err);
            });
        });

        // Send a message to the client
        res.send("Scrape Complete");
      })
      .catch(function (err) {
        console.log(err);
        res.status(500).json(err);
      });
  });

  // Route for getting an Article with its notesfrom the db
  app.get("/api/articles/:id", function (req, res) {
    console.log("Article ID");
    console.log(req.params.id);
    db
      .Article
      .findOne({ _id: req.params.id })
      .populate("note")
      .then(function (dbArtNotes) {
        console.log("One article Info");
        console.log(dbArtNotes);
        res.render("notes", dbArtNotes);
      })
      .catch(function (err) {
        console.log(err);
        res.json(err);
      })
  });

  app.get("/", function (req, res) {
    db
      .Article
      .find()
      .then(function (dbArticle) {
        console.log(dbArticle);
        res.render("index", { article: dbArticle });
      })
      .catch(function (err) {
        console.log(err);
        res.json(err);
      })
  });

  // Route for saving/updating an Article's associated Note
  app.post("/api/article/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function (dbNote) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbNote._id }}, { new: true });
      })
      .then(function (dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.redirect("/api/articles/" + dbArticle._id)
        // res.render("notes", { article: dbArticle });
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

};