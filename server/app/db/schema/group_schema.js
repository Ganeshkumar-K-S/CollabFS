db.createCollection(
    "group",
    {
        validator : {
            $jsonSchema :{
                bsonType:"object",
                required:["_id","gname","description","createdBy","createdAt"],
                properties:{
                    _id:{
                        bsonType: "string",
                        description :"id must be string"
                    },
                    gname:{
                        bsonType:"string",
                        description:"group nsme must be a string"
                    },
                    description:{
                        bsonType:"string",
                        maxLength:200,
                        description:"description must be string"
                    },
                    createdBy:{
                        bsonType:"string",
                        description:"createdBy must be a string"
                
                    },
                    createdAt: {
                        bsonType: "date",
                        description: "createAt must be of type date"
                    }           
                }
            }
        },
        validationLevel:"strict",
        validationAction:"error"

    }   
);