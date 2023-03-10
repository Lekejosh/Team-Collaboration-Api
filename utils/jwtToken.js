const sendToken = (user, statusCode, res) => {
  const accessToken = user.getJWTToken();
  const refreshToken = user.getRefreshToken();

  // Set cookie options for access token
  const accessCookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Set cookie options for refresh token
  const refreshCookieOptions = {
    expires: new Date(
      Date.now() + process.env.REFRESH_TOKEN_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Send access token as a cookie
  res
    .status(statusCode)
    .cookie("access_token", accessToken, accessCookieOptions);

  // Send refresh token as a cookie and in the response body
  res.cookie("refresh_token", refreshToken, refreshCookieOptions).json({
    success: true,
    user,
    access_token: accessToken,
    refresh_token: refreshToken,
  });
};

module.exports = sendToken;
