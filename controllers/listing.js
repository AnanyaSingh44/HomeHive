const Listing = require("../models/listing.js");
const ExpressError = require("../ExpressError.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const allListing = await Listing.find({});
  res.render("listings/index.ejs", { allListing });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};





module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
  .populate({
    path: "reviews",
    populate: { path: "author" }
  })
  .populate("owner");
  if (!listing) {
    req.flash("error", "listing you are requested for does not exist !");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing, currUser: req.user });
};

module.exports.createListing = async (req, res, next) => {
  let responce = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = responce.body.features[0].geometry;
  await newListing.save();
  req.flash("success", "New Listing Created !");
  res.redirect("/listings");
};

module.exports.editForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "listing you are requested for does not exist !");
    res.redirect("/listings");
  }
  let originalImg = listing.image.url;
  originalImg = originalImg.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImg });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  const updatedListing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true },
  );
  if (typeof req.file != "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    updatedListing.image = { url, filename };
    updatedListing.save();
  }
  req.flash("success", "Listing Updated !");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  if (!deletedListing) {
    throw new Error("Listing not found");
  }
  req.flash("success", "Listing Deleted !");
  res.redirect("/listings");
};


