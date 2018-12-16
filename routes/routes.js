const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");

// Require all models
const db = require("../models");

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsComments";
// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

module.exports = function (app) {


  // Route for getting an Article with its notesfrom the db
  app.get("/api/articles/:id", function (req, res) {
    // console.log("Article ID" + req.params.id);
    db
      .Article
      .findOne({ _id: req.params.id })
      .populate("note")
      .then(function (dbArtNotes) {
        // console.log("One article Info");
        // console.log(dbArtNotes);
        res.render("notes", dbArtNotes);
      })
      .catch(function (err) {
        console.log(err);
        res.json(err);
      })
  });

  app.get("/", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://www.foodnetwork.com")
      .then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        const $ = cheerio.load(response.data);
        // Save an empty articles object
        const articles = [];

        // Now, we grab every div with a class of m-StoryCard--Article
        $("div.m-StoryCard--Article").each(function (i, element) {
          // Add the text and href of every link, and save them as properties of the result object
          const title = $(element).find("a").children("span").text();
          const link = $(element).find("a").attr("href");
          const description = $(element).find("div.m-StoryCard__a-Description").text();
          const byLine = $(element).find("div.m-StoryCard__a-Credit").text().trim();

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
          // console.log(newArticle)
          // Create a new Article using the `articles` object built from scraping
          db.Article.findOneAndUpdate(query, { $set: newArticle }, options)
            .then(function (dbArticle) {
              // View the added result in the console
              // console.log(dbArticle);
            })
            .catch(function (err) {
              // If an error occurred, log it
              console.log(err);
            });
        });

        db
        .Article
        .find()
        .sort({_id: 'desc'})
        .then(function (dbArticle) {
          // console.log(dbArticle);
          res.render("index", { article: dbArticle });
        })
        .catch(function (err) {
          console.log(err);
          res.json(err);
        });
  
        // Send a message to the client
        // res.send("Scrape Complete");
      })
      .catch(function (err) {
        console.log(err);
        res.status(500).json(err);
      });
  });
  // app.get("/", function (req, res) {
  //   db
  //     .Article
  //     .find()
  //     .then(function (dbArticle) {
  //       // console.log(dbArticle);
  //       res.render("index", { article: dbArticle });
  //     })
  //     .catch(function (err) {
  //       console.log(err);
  //       res.json(err);
  //     });
  // });

  // Route for saving/updating an Article's associated Note
  app.post("/api/article/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db
      .Note
      .create(req.body)
      .then(function (dbNote) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbNote._id } }, { new: true });
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

  app.delete("/api/notes/:id", function (req, res) {
    console.log(`delete id ${req.params.id}`);
    db
      .Note
      .deleteOne({
        where: {
          _id: req.params.id
        }
      }).then(function (dbNote) {
        console.log(`delete result`);
        console.log(dbNote);
        return db.Article.findOneAndUpdate({ note: req.params.id }, { $pull: { note: req.params.id } }, { new: true });
      }).then(function (dbArticle) {
        console.log(`article result`);
        console.log(dbArticle);
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
        //res.redirect("/api/articles/" + dbArticle._id);
        // res.render("notes", { article: dbArticle });
      })
      .catch(function (err) {
        console.log(err);
        res.json(err);
      });
  });

};