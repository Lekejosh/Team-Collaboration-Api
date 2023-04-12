const sendToken = (user, statusCode, res) => {
  // const refreshToken = user.getRefreshToken();
  const token = user.getAccessToken();

  //Option for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // sameSite: "lax",
  };
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;
