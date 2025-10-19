import React, { useEffect } from "react";
import { serverUrl } from "../src/App";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../src/redux/userSlice";

const useGetMyOrders = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
          withCredentials: true,
        });
        console.log(result.data);
        dispatch(setMyOrders(result.data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchOrders();
  }, [userData]);
};

export default useGetMyOrders;
