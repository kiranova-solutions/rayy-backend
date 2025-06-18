const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");


const attendeeSchema = new mongoose.Schema(
    {
        clientId: {
            type: String,
            ref: "User",
            required: true,
        },
        paymentScreenshotUrl: {
            type: String,
        },
        registeredAt: {
            type: Date,
            default: Date.now,
        },
        status : {
          type: String,
          enum: ["pending", "approved", "denied"],
          default: "pending",
        }
    },
    { _id: false }
);


const eventSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          let startDateToCompare;

          if (this.startDate) {
            startDateToCompare = this.startDate;
          } else if (typeof this.get === 'function') {
            startDateToCompare = this.get('startDate');
          }

          if (!startDateToCompare) return true;

          return value >= startDateToCompare;
        },
        message: "End date must be greater than or equal to start date",
      },
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    video: {
      type: String,
    },
    location: {
      type: String,
    },
    services: {
      type: String,
    },
    serviceDetails: {
      type: String,
      required: true,
    },
    paymentDetails: {
      type: String,
    },
    rating : {
      type: Number,
      default: 0,
    },
    numberOfAttendees: {
      type: Number,
      required: true,
      min: 1,
    },
    attendees: [attendeeSchema],
    eventPrice: {
      type: Number,
      min: 0,
    },
    vendor: {
      type: String,
      ref: "User",
      required: true,
    },
    isPaid : {
        type: Boolean,
        required: true,
    }, 
    paymentCollection: {
        type: String,
        enum: ["preEvent", "atEvent"],
    },
  },
  { 
    timestamps: true 
  }
);

// Add indexes for better query performance
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ vendor: 1 });

// Virtual to check if event is full
eventSchema.virtual('isFull').get(function() {
  return this.numberOfAttendees && this.attendees.length >= this.numberOfAttendees;
});

// Virtual to get remaining spots
eventSchema.virtual('remainingSpots').get(function() {
  if (!this.maxAttendees) return null;
  return Math.max(0, this.maxAttendees - this.attendees.length);
});

// Virtual to get current attendees count
eventSchema.virtual('currentAttendees').get(function() {
  return this.attendees.length;
});


module.exports = mongoose.model("Event", eventSchema);
