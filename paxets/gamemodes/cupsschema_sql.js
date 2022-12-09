// Require Dependencies
const mongoose = require("mongoose");
const SchemaTypes = mongoose.SchemaTypes;

// Setup CupsGame Schema
const CupsGameSchema = new mongoose.Schema({
  // Basic fields
  betAmount: Number, // User bet amount
  privateGame: Boolean, // Whether this is a private game
  playerAmount: Number, // How many players can play
  costMultiplier: Number, // How many percentage of the joining cost does the creator pay (only for private games)
  inviteCode: String, // Custom invite code (only for private games)

  // Provably Fair fields
  privateSeed: String,
  privateHash: String,
  publicSeed: {
    type: String,
    default: null,
  },
  randomModule: {
    type: Number,
    default: null,
  },

  // UserID of the player who won
  _winner: {
    type: SchemaTypes.ObjectId,
    ref: "User",
    default: null,
  },

  // UserID of who created this game
  _creator: {
    type: SchemaTypes.ObjectId,
    ref: "User",
  },

  // All players that joined
  players: {
    type: Array,
    default: [],
  },

  // All players that voted for a bot
  voteBot: {
    type: Array,
    default: [],
  },

  // Indicates if the bot was called or not
  isBotCalled: {
    type: Boolean,
    default: false,
  },

  // Game status
  status: {
    type: Number,
    default: 1,
    /**
     * Status list:
     *
     * 1 = Waiting
     * 2 = Rolling
     * 3 = Ended
     */
  },

  // When game was created
  created: {
    type: Date,
    default: Date.now,
  },
});

// Create and export the new model
const CupsGame = (module.exports = mongoose.model("CupsGame", CupsGameSchema));
