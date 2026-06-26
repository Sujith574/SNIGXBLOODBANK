import { Schema, model, Document } from "mongoose";

export interface IDonation extends Document {
  donorId: string; // reference to Donor collection
  hospitalId: string; // reference to Hospital collection
  bloodGroup: string;
  units: number;
  donationDate: Date;
  collectionCenter: string;
  healthStatus: string;
  testResult: "passed" | "failed";
  certificateNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    donorId: { type: String, required: true },
    hospitalId: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true },
    donationDate: { type: Date, default: Date.now, required: true },
    collectionCenter: { type: String, required: true },
    healthStatus: { type: String, required: true },
    testResult: { type: String, enum: ["passed", "failed"], required: true },
    certificateNumber: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Donation = model<IDonation>("Donation", DonationSchema);
