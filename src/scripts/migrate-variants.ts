import mongoose from "mongoose";
import { Product } from "../models/Product";

async function migrateVariants() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/madhur-sweets");
    console.log("Connected to MongoDB");

    // Find all products without variants or with empty variants
    const products = await Product.find({
      $or: [
        { variants: { $exists: false } },
        { variants: { $size: 0 } },
      ],
    });

    console.log(`Found ${products.length} products to migrate`);

    // Migrate each product
    let updated = 0;
    for (const product of products) {
      // Create variant from default weight and price
      const defaultVariant = {
        weight: product.weight,
        price: product.price,
        discountPrice: product.discountPrice,
      };

      // Update product with variant
      await Product.updateOne(
        { _id: product._id },
        { $set: { variants: [defaultVariant] } }
      );

      updated++;
      console.log(`✓ Migrated: ${product.name}`);
    }

    console.log(`\n✅ Migration complete! Updated ${updated} products`);
    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateVariants();
