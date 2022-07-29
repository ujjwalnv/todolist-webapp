const express = require("express");
const app = express();
const _ = require("lodash");
const mongoose = require("mongoose");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const task1 = new Item({
  name: "Hello There! Read below Instructions",
});
const task2 = new Item({
  name: "Add new Tasks Using + Icon",
});
const task3 = new Item({
  name: "<--- Click here to Delete Task",
});

const defaultItems = [task1, task2, task3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

var today = new Date();
var options = {
  weekday: "long",
  day: "numeric",
  month: "long",
};
var day = today.toLocaleDateString("en-US", options);

app.get("/", function (req, res) {
  Item.find({}, function (err, items) {
    if (err) {
      console.log(err);
    } else {
      if (items.length === 0) {
        //inserting default items when there are no items
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully Inserted Data into the DB");
          }
        });
      }
      res.render("lists", {
        listTitle: day,
        newTasks: items,
      });
    }
  });
});

app.get("/:listName", function (req, res) {
  const listName = _.capitalize(req.params.listName);
  List.findOne({ name: listName }, (err, result) => {
    if (!err) {
      if (!result) {
        const list = new List({
          name: listName,
          items: defaultItems,
        });
        list.save(() => res.redirect("/" + listName));
      } else {
        res.render("lists", {
          listTitle: result.name,
          newTasks: result.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  let task = req.body.task;
  let listTitle = req.body.list;
  const item = new Item({
    name: task,
  });
  if (listTitle === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listTitle);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.list;
  if (listTitle === day) {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted the document!");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listTitle },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listTitle);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server is up and running");
});
