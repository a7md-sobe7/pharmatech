import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGO_URI = "mongodb+srv://a7mdsabe7_db_user:M7WLey3Z0kgknaSW@cluster0.iilsrja.mongodb.net/pharmamatch?retryWrites=true&w=majority";

const shortageSchema = new mongoose.Schema({
  medicineName: String,
  neededQuantity: Number,
  status: String,
});
const Shortage = mongoose.model('Shortage', shortageSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  const shortages = await Shortage.find({ status: { $ne: 'RESOLVED' } });
  
  let totalUnits = 0;
  let totalPrice = 0;

  const drugsData = JSON.parse(fs.readFileSync('../client/public/reference-db/egyptian-drugs.json', 'utf8'));

  for (const shortage of shortages) {
    totalUnits += shortage.neededQuantity;
    const drug = drugsData.find(d => d.commercial_name_en === shortage.medicineName);
    if (drug && drug.price_egp) {
      totalPrice += (drug.price_egp * shortage.neededQuantity);
    }
  }

  console.log(`Total units needed: ${totalUnits}`);
  console.log(`Estimated total price: ${totalPrice.toFixed(2)} EGP`);
  process.exit(0);
}

run().catch(console.error);
