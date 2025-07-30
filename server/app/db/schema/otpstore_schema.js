db.createCollection(
  "otp_store",
  {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["email", "otp", "createdAt"],
        properties: {
          email: {
            bsonType: "string",
            description: "Email must be a string and is required"
          },
          otp: {
            bsonType: "string",
            description: "OTP must be a string and is required"
          },
          createdAt: {
            bsonType: "datetime",
            description: "createdAt must be a datetime and is required"
          }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  }
);
