import { Schema, model, Document } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  registrationNumber: string;
  licenseNumber: string;
  doctorName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  profilePhotoUrl?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    licenseNumber: { type: String, required: true, unique: true },
    doctorName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    profilePhotoUrl: { type: String },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Hospital = model<IHospital>('Hospital', HospitalSchema);
