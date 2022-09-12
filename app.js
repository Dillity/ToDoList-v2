//jshint esversion:6
const mongoose = require('mongoose');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/ToDoListDB');

const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your ToDo List!'
});

const item2 = new Item({
  name: '<-- Hit this to delete an item.'
});

const item3 = new Item({
  name: 'Hit the plus button to add a new item'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List', listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log('Inserted successfully.');
        }
      });
      res.redirect('/');
    } else {
        res.render("list", {listTitle: 'Today', newListItems: foundItems});
    }
  });
});

app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList) {
    if(err) {
      console.log(err);
    } else {
      if(foundList) {
        res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
      } else {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName);
      }
    }
  })

});


app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});


app.post("/", function(req, res){
const itemName = req.body.newItem;
const listName = req.body.list;

const item = new Item({
  name: itemName
});

if(listName === 'Today') {
  item.save();
  res.redirect('/');
} else {
  List.findOne({name: listName}, function(err, foundList) {
    foundList.items.push(item);
    foundList.save();
    res.redirect('/' + listName);
  });
}
});

app.post('/delete', function(req, res) {
  if(req.body.listName === 'Today') {
    Item.deleteOne({_id: req.body.checkbox}, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log('Deleted successfully');
      }
      res.redirect('/');
    });
  } else {
    List.findOneAndUpdate({name: req.body.listName}, {$pull:{items:{_id: req.body.checkbox}}}, function(err, foundList) {
      if(!err) {
        res.redirect('/' + req.body.listName);
      } else {
        console.log(err);
      }
    });
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
