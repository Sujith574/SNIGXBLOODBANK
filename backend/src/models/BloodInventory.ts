import { Schema, model, Document } from "mongoose";

export interface IBloodInventory extends Document {
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  unitsAvailable: number;
  collectionDate: Date;
  expiryDate: Date;
  status: "available" | "reserved" | "expired";
  storageLocation?: string;
  batchNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BloodInventorySchema = new Schema<IBloodInventory>(
  {
    bloodGroup: { type: String, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-"], required: true },
    unitsAvailable: { type: Number, required: true, min: 0 },
    collectionDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ["available","reserved","expired"], default: "available" },
    storageLocation: { type: String },
    batchNumber: { type: String },
  },
  { timestamps: true }
);

// Auto‑expire hook – mark as expired when past expiry date
BloodInventorySchema.pre<IBloodInventory>("save", function (next) {
  if (this.expiryDate <= new Date()) {
    this.status = "expired";
  }
  next();
});

export const BloodInventory = model<IBloodInventory>("BloodInventory", BloodInventorySchema);
