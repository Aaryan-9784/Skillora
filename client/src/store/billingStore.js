import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

const useBillingStore = create((set) => ({
  info:      null,
  isLoading: false,

  fetchInfo: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/billing");
      set({ info: data.data });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Initiate Razorpay subscription checkout.
   * Opens the Razorpay payment modal in the browser.
   */
  subscribe: async (planName, userInfo) => {
    try {
      const { data } = await api.post("/billing/subscribe", { plan: planName });
      const { subscriptionId, keyId, amount, currency, userName, userEmail } = data.data;

      return new Promise((resolve, reject) => {
        const options = {
          key:          keyId,
          subscription_id: subscriptionId,
          name:         "Skillora",
          description:  `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
          image:        "/logo.png",
          prefill: {
            name:  userName  || userInfo?.name,
            email: userEmail || userInfo?.email,
          },
          theme: { color: "#635BFF" },
          handler: async (response) => {
            try {
              const verifyRes = await api.post("/billing/verify", {
                razorpay_payment_id:      response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature:       response.razorpay_signature,
              });
              toast.success(`🎉 ${planName} plan activated!`);
              set({ info: null }); // force refetch
              resolve(verifyRes.data.data);
            } catch (err) {
              toast.error("Payment verification failed");
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        };

        // Load Razorpay script dynamically if not already loaded
        if (!window.Razorpay) {
          const script = document.createElement("script");
          script.src   = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => new window.Razorpay(options).open();
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        } else {
          new window.Razorpay(options).open();
        }
      });
    } catch (err) {
      if (err.message !== "Payment cancelled") {
        toast.error(err.response?.data?.message || "Subscription failed");
      }
      throw err;
    }
  },

  cancelSubscription: async () => {
    await api.post("/billing/cancel");
    toast.success("Subscription will cancel at period end");
    set({ info: null });
  },
}));

export default useBillingStore;
