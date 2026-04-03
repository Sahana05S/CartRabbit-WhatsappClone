const mongoose = require('mongoose');

const GROUP_COLORS = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#db2777', '#0891b2'];

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [1, 'Group name must be at least 1 character'],
      maxlength: [50, 'Group name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    avatarColor: {
      type: String,
      default: function () {
        return GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];
      },
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      editGroupInfo: {
        type: String,
        enum: ['all', 'admins'],
        default: 'all', // "all" means any member can edit, "admins" means only admins
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
