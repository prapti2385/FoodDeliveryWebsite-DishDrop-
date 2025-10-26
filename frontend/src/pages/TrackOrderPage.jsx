import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { serverUrl } from "../App";
import { useEffect } from "react";
import axios from "axios";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useState } from "react";
import DeliveryBoyTracking from "../components/DeliveryBoyTracking";
import { current } from "@reduxjs/toolkit";

const TrackOrderPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [currentOrder, setCurrentOrder] = useState();
  const handleGetOrder = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-order-by-id/${orderId}`,
        { withCredentials: true }
      );
      setCurrentOrder(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleGetOrder();
  }, [orderId]);
  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      <div
        className="relative top-[20px] left-[20px] z-[10] mb-[10px] cursor-pointer flex gap-4 items-center"
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
        <h1 className="text-2xl font-bold md:text-center">Track Order</h1>
      </div>
      {currentOrder?.shopOrders?.map((shopOrder, index) => (
        <div
          className="bg-white p-4 rounded-2xl shadow-md border border-orange-200 spcae-y-4"
          key={index}
        >
          <div>
            <p className="text-lg font-bold mb-2 text-[#ff4d2d]">
              {shopOrder.shop.name}
            </p>
            <p className="font-semibold">
              <span>Items: </span>{" "}
              {shopOrder.shopOrderItems.map((i) => i.name).join(", ")}
            </p>
            <p>
              <span className="font-semibold">Subtotal: </span>₹
              {shopOrder.subTotal}
            </p>
            <p>
              <span>Delivery Address: </span>
              {currentOrder.deliveryAddress.text}
            </p>
          </div>
          {shopOrder.status != "delivered" ? (
            <>
              {shopOrder.assignedDeliveryBoy ? (
                <div className="text-sm text-gray-700">
                  <p className="font-semibold">
                    <span>Delivery Boy Name: </span>
                    {shopOrder.assignedDeliveryBoy.fullName}
                  </p>
                  <p className="font-semibold">
                    <span>Delivery Boy Mobile Number: </span>
                    {shopOrder.assignedDeliveryBoy.mobile}
                  </p>
                </div>
              ) : (
                <p className="font-semibold">
                  Delivery Boy is not assigned yet
                </p>
              )}
            </>
          ) : (
            <p className="text-green-600 font-semibold text-lg">Delivered</p>
          )}
          {shopOrder.assignedDeliveryBoy &&
            shopOrder.status !== "delivered" && (
              <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-md">
                <DeliveryBoyTracking
                  data={{
                    deliveryBoyLocation: {
                      lat: shopOrder.assignedDeliveryBoy.location
                        .coordinates[1],
                      lon: shopOrder.assignedDeliveryBoy.location
                        .coordinates[0],
                    },
                    customerLocation: {
                      lat: currentOrder.deliveryAddress.latitude,
                      lon: currentOrder.deliveryAddress.longitude,
                    },
                  }}
                />
              </div>
            )}
        </div>
      ))}
    </div>
  );
};

export default TrackOrderPage;
