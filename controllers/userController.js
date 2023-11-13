const Post = require("../models/Post");
const User = require("../models/User");
const { mapPostOutput } = require("../utils/Utils");
const { error, success } = require("../utils/responseWrapper");
const cloudinary = require("cloudinary").v2;

const followOrUnfollowUser = async (req, res) => {
  try {
    const { userIdToFollow } = req.body; //jise follow karna hai
    const curUserId = req._id; //jo follow karna chah ra

    const userToFollow = await User.findById(userIdToFollow);
    const curUser = await User.findById(curUserId);

    if (curUserId === userIdToFollow) {
      return res.send(error(409, "You can't follow yourself"));
    }

    if (!userToFollow) {
      return res.send(error(404, "User to follow not found"));
    }

    //if jise follow karna hai vo already maine follow kar rakha hai jo use unfollow kar denge
    if (curUser.followings.includes(userIdToFollow)) {
      const followingIndex = curUser.followings.indexOf(userIdToFollow);
      curUser.followings.splice(followingIndex, 1);

      const followerIndex = userToFollow.followers.indexOf(curUserId);
      userToFollow.followers.splice(followerIndex, 1);

      // return res.send(success(200, "User Unfollowed"));
    }
    //agar already follow nahi kia hai to ab follow kar denge
    else {
      curUser.followings.push(userIdToFollow);
      userToFollow.followers.push(curUserId);

      // return res.send(success(200, "User Followed"));
    }
    await userToFollow.save();
    await curUser.save();
    return res.send(success(200, { user: userToFollow }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

const getPostsOfFollowing = async (req, res) => {
  try {
    const curUserId = req._id;

    const curUser = await User.findById(curUserId).populate("followings");

    //jis jis post ke owner mere curUser ki following me ho vo vo post laake dedo
    const fullPosts = await Post.find({
      owner: {
        $in: curUser.followings,
      },
    }).populate("owner");

    const posts = fullPosts
      .map((item) => mapPostOutput(item, req._id))
      .reverse();

    const followingsIds = curUser.followings.map((item) => item._id);
    followingsIds.push(req._id);

    const suggestions = await User.find({
      _id: {
        $nin: followingsIds,
      },
    });

    return res.send(success(200, { ...curUser._doc, suggestions, posts }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

const getMyPosts = async (req, res) => {
  try {
    const curUserId = req._id;

    const curUser = await User.findById(curUserId);
    const posts = await Post.find({
      owner: curUser,
    }).populate("likes");

    //populate(likes) vo users ko likes me dikha dega jinhone like kia hai

    return res.send(success(200, { posts }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

const getAnyUserPosts = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.send(error(400, "userId is required"));
    }

    const allUserposts = await Post.find({
      owner: userId,
    }).populate("likes");

    return res.send(success(200, { allUserposts }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

const deleteMyProfile = async (req, res) => {
  try {
    const curUserId = req._id;
    const curUser = await User.findById(curUserId);

    //delete all posts
    await Post.deleteMany({
      owner: curUserId,
    });

    //remove myself from followers following
    curUser.followers.forEach(async (followerId) => {
      const follower = await User.findById(followerId);
      const index = follower.followings.indexOf(curUserId);
      follower.followings.splice(index, 1);
      await follower.save();
    });

    //remove myself from my following's followers
    curUser.followings.forEach(async (followingId) => {
      const following = await User.findById(followingId);
      const index = following.followers.indexOf(curUserId);
      following.followers.splice(index, 1);
      await following.save();
    });

    //remove myself from all likes
    const allPosts = await Post.find();
    allPosts.forEach(async (post) => {
      const index = post.likes.indexOf(curUserId);
      post.likes.splice(index, 1);
      await post.save();
    });

    //delete user
    await curUser.remove();

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
    });

    res.send(success(200, "user deleted"));
  } catch (e) {
    console.log(e.message);
    res.send(error(500, e.message));
  }
};

const getMyInfo = async (req, res) => {
  try {
    const user = await User.findById(req._id);
    return res.send(success(200, { user }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, bio, userImg } = req.body;
    const user = await User.findById(req._id);
    if (name) {
      user.name = name;
    }
    if (bio) {
      user.bio = bio;
    }
    if (userImg) {
      const cloudImg = await cloudinary.uploader.upload(userImg, {
        folder: "profileImg",
      });
      user.avatar = {
        url: cloudImg.secure_url,
        publicId: cloudImg.public_id,
      };
    }
    await user.save();
    return res.send(success(200, { user }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId;

    const user = await User.findById(userId).populate({
      path: "posts",
      populate: {
        path: "owner",
      },
    });

    const fullPosts = user.posts;
    const posts = fullPosts
      .map((item) => mapPostOutput(item, req._id))
      .reverse();

    return res.send(success(200, { ...user._doc, posts }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

module.exports = {
  followOrUnfollowUser,
  getPostsOfFollowing,
  getMyPosts,
  getAnyUserPosts,
  deleteMyProfile,
  getMyInfo,
  updateUserProfile,
  getUserProfile,
};
