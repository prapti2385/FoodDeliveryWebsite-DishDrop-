import Shop from "../models/shop.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import { sendDeliveryOTP } from "../utils/mail.js";
import Razorpay from "razorpay";
import "dotenv/config";

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;
    if (cartItems.length === 0 || !cartItems) {
      return res.status(400).json({ message: `Cart is empty` });
    }
    if (
      !deliveryAddress.text ||
      !deliveryAddress.latitude ||
      !deliveryAddress.longitude
    ) {
      return res
        .status(400)
        .json({ message: `No complete delivery address found` });
    }

    const groupItemsByShop = {};

    cartItems.forEach((item) => {
      const shopId = item.shop;
      if (!groupItemsByShop[shopId]) {
        groupItemsByShop[shopId] = [];
      }
      groupItemsByShop[shopId].push(item);
    });

    const shopOrders = await Promise.all(
      Object.keys(groupItemsByShop).map(async (shopId) => {
        const shop = await Shop.findById(shopId).populate("owner");
        if (!shop) {
          return res.status(400).json({ message: "Shop not found" });
        }
        const items = groupItemsByShop[shopId];
        const subTotal = items.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0
        );
        return {
          shop: shop._id,
          owner: shop.owner._id,
          subTotal,
          shopOrderItems: items.map((i) => ({
            item: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        };
      })
    );

    if (paymentMethod == "online") {
      const razorOrder = await instance.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });
      const newOrder = await Order.create({
        user: req.userId,
        paymentMethod,
        deliveryAddress,
        totalAmount,
        shopOrders,
        razorpayOrderId: (await razorOrder).id,
        payment: false,
      });

      return res.status(200).json({
        razorOrder,
        orderId: newOrder._id,
      });
    }
    const newOrder = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
    });

    await newOrder.populate(
      "shopOrders.shopOrderItems.item",
      "name image price"
    );
    await newOrder.populate("shopOrders.shop", "name");

    return res.status(201).json(newOrder);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Place order error ${error.message}` });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpayPaymentId, orderId } = req.body;
    const payment = await instance.payments.fetch(razorpayPaymentId);
    if (!payment || payment.status !== "captured") {
      return res.status(400).json({ message: `No payment made` });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }

    order.payment = true;
    order.razorpayPayment = razorpayPaymentId;
    await order.populate("shopOrders.shopOrderItems.item", "name image price");
    await order.populate("shopOrders.shop", "name");
    await order.save();
    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: `Verify payment error ${error}` });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role === "User") {
      const orders = await Order.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price");
      return res.status(200).json(orders);
    } else if (user.role === "Owner") {
      const orders = await Order.find({ "shopOrders.owner": req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("user")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("shopOrders.assignedDeliveryBoy", "fullName mobile email");
      const filteredOrders = orders.map((order) => ({
        _id: order._id,
        paymentMethod: order.paymentMethod,
        user: order.user,
        shopOrders: order.shopOrders.find(
          (o) => o.owner._id.toString() === req.userId
        ),
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
      }));
      return res.status(200).json(filteredOrders);
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Get My Orders Error ${error.message}` });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);

    const shopOrder = await order.shopOrders.find(
      (o) => shopId === o.shop.toString()
    );
    if (!shopOrder) {
      return res.status(400).json({ message: `Shop Order not found` });
    }
    shopOrder.status = status;
    let deliveryBoysPayload = [];
    if (status == "out for delivery" && !shopOrder.assignment) {
      const { longitude, latitude } = order.deliveryAddress;
      const nearByDeliveryBoys = await User.find({
        role: "Delivery Boy",
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)],
              $maxDistance: 5000,
            },
          },
        },
      });

      const nearByIds = nearByDeliveryBoys.map((boy) => boy._id);
      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: { $nin: ["broadcasted", "completed"] },
      }).distinct("assignedTo");

      const busyIdSet = new Set(busyIds.map((id) => String(id)));
      const availableBoys = nearByDeliveryBoys.filter(
        (boy) => !busyIdSet.has(String(boy._id))
      );
      const candidates = availableBoys.map((boy) => boy._id);
      if (candidates.length == 0) {
        await order.save();
        return res.json({
          message:
            "Order status updated but there is no delivery boys available",
        });
      }
      const deliveryAssignment = await DeliveryAssignment.create({
        order: order._id,
        shop: shopOrder.shop,
        shopOrderId: shopOrder._id,
        broadcastedTo: candidates,
        status: "broadcasted",
      });
      shopOrder.assignedDeliveryBoy = deliveryAssignment.assignedTo;
      shopOrder.assignment = deliveryAssignment._id;
      deliveryBoysPayload = availableBoys.map((boy) => ({
        id: boy._id,
        fullName: boy.fullName,
        longitude: boy.location.coordinates?.[0],
        latitude: boy.location.coordinates?.[1],
        mobile: boy.mobile,
      }));
    }

    await shopOrder.save();
    await order.save();
    const updatedShopOrder = await order.shopOrders.find(
      (o) => shopId === o.shop.toString()
    );
    await order.populate("shopOrders.shop", "name");
    await order.populate(
      "shopOrders.assignedDeliveryBoy",
      "fullName email mobile "
    );

    return res.status(200).json({
      shopOrder: updatedShopOrder,
      assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
      availableBoys: deliveryBoysPayload,
      assignment: updatedShopOrder?.assignment._id,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Update order status error ${error.message}` });
  }
};

export const getDeliveryBoyAssignment = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const assignments = await DeliveryAssignment.find({
      broadcastedTo: deliveryBoyId,
      status: "broadcasted",
    })
      .populate("order")
      .populate("shop");
    const formatted = assignments.map((a) => ({
      assignmentId: a._id,
      orderId: a.order._id,
      shopName: a.shop.name,
      deliveryAddress: a.order.deliveryAddress,
      items:
        a.order.shopOrders.find((so) => so._id.equals(a.shopOrderId))
          .shopOrderItems || [],
      subTotal: a.order.shopOrders.find((so) => so._id.equals(a.shopOrderId))
        .subTotal,
    }));
    return res.status(200).json(formatted);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Getting delivery boy assignment error ${error}` });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await DeliveryAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(400).json({ message: "Assignment not found" });
    }

    if (assignment.status != "broadcasted") {
      return res.status(400).json({ message: "Assignment is expired" });
    }

    const alreadyAssigned = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: { $nin: ["broadcasted", "completed"] },
    });

    if (alreadyAssigned) {
      return res
        .status(400)
        .json({ message: "You are already assigned to other order" });
    }

    assignment.assignedTo = req.userId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }
    const shopOrder = order.shopOrders.id(assignment.shopOrderId);
    shopOrder.assignedDeliveryBoy = req.userId;
    await order.save();
    return res.status(200).json({ message: "Order accepted" });
  } catch (error) {
    return res.status(500).json({ message: `Accepting order error ${error}` });
  }
};

export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned",
    })
      .populate("shop", "name")
      .populate("assignedTo", "fullName email mobile location")
      .populate({
        path: "order",
        populate: [{ path: "user", select: "fullName email location mobile" }],
      });

    if (!assignment) {
      return res.status(400).json({ message: "Assignment not found" });
    }
    if (!assignment.order) {
      return res.status(400).json({ message: "Order not found" });
    }

    const shopOrder = assignment.order.shopOrders.find(
      (so) => String(so._id) == String(assignment.shopOrderId)
    );

    if (!shopOrder) {
      return res.status(400).json({ message: "Shop Order not found" });
    }

    let deliveryBoyLocation = { lat: null, lon: null };
    if (
      assignment.assignedTo?.location?.coordinates &&
      assignment.assignedTo.location.coordinates.length === 2
    ) {
      deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
      deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
    }

    let customerLocation = { lat: null, lon: null };
    if (assignment.order.deliveryAddress) {
      customerLocation.lat = assignment.order.deliveryAddress.latitude;
      customerLocation.lon = assignment.order.deliveryAddress.longitude;
    }

    return res.status(200).json({
      _id: assignment.order._id,
      user: assignment.order.user,
      shopOrder,
      deliveryAddress: assignment.order.deliveryAddress,
      deliveryBoyLocation,
      customerLocation,
    });
  } catch (error) {
    return res.status(500).json({ message: `Current Order Error ${error}` });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("user")
      .populate({
        path: "shopOrders.shop",
        model: "Shop",
      })
      .populate({
        path: "shopOrders.assignedDeliveryBoy",
        model: "User",
      })
      .populate({
        path: "shopOrders.shopOrderItems.item",
        model: "Item",
      })
      .lean();
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }
    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: `Get By Id order error ${error}` });
  }
};

export const sendDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.body;
    const order = await Order.findById(orderId).populate("user");
    const shopOrder = order.shopOrders.find((so) => so._id == shopOrderId);
    if (!order || !shopOrder) {
      return res
        .status(400)
        .json({ message: "No Order or no shop order found" });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    shopOrder.deliveryOtp = otp;
    shopOrder.otpExpires = Date.now() + 5 * 60 * 60 * 1000;
    await order.save();
    await sendDeliveryOTP(order.user, otp);
    return res
      .status(200)
      .json({ message: ` OTP sent successfully ${order.user.fullName}` });
  } catch (error) {
    return res.status(500).json({ message: `Delivery OTP error ${error}` });
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { shopOrderId, orderId, otp } = req.body;
    const order = await Order.findById(orderId);
    const shopOrder = order.shopOrders.id(shopOrderId);
    if (!order || !shopOrder) {
      return res.status(400).json({ message: "Order or ShopOrder not found" });
    }
    if (
      shopOrder.deliveryOtp !== otp ||
      !shopOrder.otpExpires ||
      shopOrder.otpExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    shopOrder.status = "delivered";
    shopOrder.deliveredAt = Date.now();
    await order.save();
    await DeliveryAssignment.deleteOne({
      shopOrderId: shopOrder._id,
      order: order._id,
      assignedTo: shopOrder.assignedDeliveryBoy,
    });
    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({ message: `OTP verification error ${error}` });
  }
};
