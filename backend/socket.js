import User from "./models/user.model.js";

export const socketHandler = async (io) => {
  io.on("connection", (socket) => {
    socket.on("identity", async ({ userId }) => {
      try {
        const user = await User.findByIdAndUpdate(
          userId,
          {
            socketId: socket.id,
            isOnline: true,
          },
          { new: true }
        );
      } catch (error) {
        console.log(error);
      }
    });
    socket.on("disconnect", async () => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          {
            socketId: null,
            isOnline: false,
          }
        );
      } catch (error) {
        console.log(error);
      }
    });
    socket.on(
      "updateLocation",
      async ({ deliveryBoyId, latitude, longitude }) => {
        try {
          const user = await User.findByIdAndUpdate(
            deliveryBoyId,
            {
              location: {
                type: "Point",
                coordinates: [longitude, latitude],
              },
              isOnline: true,
              socketId: socket.id,
            },
            { new: true }
          );
          if (user) {
            io.emit("updateDeliveryLocation", {
              latitude,
              longitude,
              deliveryBoyId,
            });
          }
        } catch (error) {
          console.log(error);
        }
      }
    );
  });
};
