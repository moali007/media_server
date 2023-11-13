const requireUser = require("../middlewares/requireUser");
const UserController = require("../controllers/userController");
const router = require("express").Router();

router.post("/follow", requireUser, UserController.followOrUnfollowUser);
router.get("/getFeedData", requireUser, UserController.getPostsOfFollowing);
router.get("/myPosts", requireUser, UserController.getMyPosts);
router.get("/userPosts", requireUser, UserController.getAnyUserPosts);
router.delete("/", requireUser, UserController.deleteMyProfile);
router.get("/getMyInfo", requireUser, UserController.getMyInfo);
router.put("/", requireUser, UserController.updateUserProfile);
router.post("/getUserProfile", requireUser, UserController.getUserProfile);

module.exports = router;
