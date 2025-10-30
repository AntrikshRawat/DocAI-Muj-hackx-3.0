import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { asyncHandler } from '../middleware/asyncHandler';
import User from '../models/User';
import config from '../config/config';

const client = new OAuth2Client(config.googleClientId);

// @desc    Google Sign-In
// @route   POST /api/auth/google
// @access  Public
export const googleSignIn = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({
      status: 'error',
      message: 'Token is required'
    });
    return;
  }

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.googleClientId
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
      return;
    }

    // Extract user information from payload
    const {
      sub: googleId,
      email,
      name,
      picture
    } = payload;

    if (!googleId) {
      res.status(400).json({
        status: 'error',
        message: 'Google ID not provided'
      });
      return;
    }

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: 'Email not provided by Google'
      });
      return;
    }

    // Check if user already exists
    let user = await User.findOne({ googleId });

    if (user) {
      // Update existing user information
      user.email = email;
      user.name = name || user.name;
      user.picture = picture;
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
        data: { user }
      });
    } else {
      // Create new user
      const newUser = await User.create({
        googleId,
        email,
        name: name || 'Google User',
        picture
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: { user: newUser }
      });
    }
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid token or authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
