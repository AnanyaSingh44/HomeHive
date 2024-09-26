const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { reviewSchema } = require("../schema.js");
const ExpressError = require("../ExpressError.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const reviewController = require("../controllers/reviews.js");
const {
  validateReview,
  isLoggedIn,
  isOwner,
  isAuthor,
} = require("../middleware.js");

router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(reviewController.addReview),
);

// Delete Review route

router.delete("/:reviewId", isAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;
