const axios = require("axios");
const cheerio = require("cheerio");


module.exports = function (app) {

  app.get("/", function (req, res) {
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

          articles.push({
            title,
            link,
            description,
            byLine
          });

          // // Create a new Article using the `result` object built from scraping
          // db.Article.create(result)
          //   .then(function(dbArticle) {
          //     // View the added result in the console
          //     console.log(dbArticle);
          //   })
          //   .catch(function(err) {
          //     // If an error occurred, log it
          //     console.log(err);
          //   });
        });
        console.log(articles)

        // Send a message to the client
        res.send("Scrape Complete");
      })
      .catch(function (err){
        console.log(err);
        res.status(500).json(err);  
      });
  });

  // // Route for getting all Articles from the db
  // app.get("/articles", function (req, res) {
  //   // TODO: Finish the route so it grabs all of the articles
  //   db
  //     .Article
  //     .find()
  //     .then(function (dbArticle) {
  //       res.json(dbArticle);
  //     })
  //     .catch(function (err) {
  //       console.log(err);
  //       res.json(err);
  //     })
  // });

};