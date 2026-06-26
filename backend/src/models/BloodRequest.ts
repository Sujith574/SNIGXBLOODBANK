import { Schema, model, Document } from "mongoose";

export interface IBloodRequest extends Document {
  patientName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  unitsRequired: number;
  hospitalId: string; // reference to Hospital collection
  doctorName: string;
  emergencyLevel: "low" | "medium" | "high";
  reason: string;
  requiredDate: Date;
  status: "pending" | "under_review" | "approved" | "rejected" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequest>(
  {
    patientName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    unitsRequired: { type: Number, required: true },
    hospitalId: { type: String, required: true },
    doctorName: { type: String, required: true },
    emergencyLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
    reason: { type: String, required: true },
    requiredDate: { type: Date, required: true },
    status: { type: String, enum: ["pending", "under_review", "approved", "rejected", "completed"], default: "pending" },
  },
  { timestamps: true }
);

export const BloodRequest = model<IBloodRequest>("BloodRequest", BloodRequestSchema);
