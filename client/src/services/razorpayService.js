import api from "./api";
import toast from "react-hot-toast";

/**
 * Dynamically loads Razorpay Checkout SDK script
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Triggers Razorpay Checkout modal & verifies payment on completion
 */
export const processRazorpayPayment = async ({
  invoiceId,
  amount,
  currency = "INR",
  name = "Skillora Payment",
  description = "Payment via Razorpay Gateway",
  userEmail = "",
  userName = "",
  onSuccess,
  onError,
}) => {
  try {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error("Failed to load Razorpay Payment Gateway SDK.");
      if (onError) onError(new Error("SDK load failed"));
      return;
    }

    // Step 1: Create Razorpay Order from backend
    const { data: orderRes } = await api.post("/payments/razorpay/create-order", {
      invoiceId,
      amount,
      currency,
    });

    const orderData = orderRes.data || orderRes;
    const { orderId, keyId, amount: orderAmount, currency: orderCurrency } = orderData;

    // Step 2: Configure Razorpay Checkout options
    const options = {
      key: keyId,
      amount: orderAmount,
      currency: orderCurrency,
      name: name || "Skillora Workspace",
      description: description || `Invoice Payment ${invoiceId || ""}`,
      image: "https://cdn-icons-png.flaticon.com/512/9908/9908298.png",
      order_id: orderId,
      handler: async (response) => {
        const verifyToast = toast.loading("Verifying Razorpay payment...");
        try {
          // Step 3: Verify Razorpay signature on backend
          const { data: verifyRes } = await api.post("/payments/razorpay/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            invoiceId,
            amount,
            currency,
          });

          toast.dismiss(verifyToast);
          toast.success("Payment completed & verified via Razorpay! 🎉");

          if (onSuccess) onSuccess(verifyRes.data);
        } catch (err) {
          toast.dismiss(verifyToast);
          toast.error(err?.response?.data?.message || "Payment verification failed.");
          if (onError) onError(err);
        }
      },
      prefill: {
        name: userName,
        email: userEmail,
      },
      theme: {
        color: "#635BFF",
      },
      modal: {
        ondismiss: () => {
          toast("Razorpay checkout cancelled.", { icon: "ℹ️" });
          if (onError) onError(new Error("Checkout cancelled"));
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    toast.error(err?.response?.data?.message || "Failed to initiate Razorpay checkout.");
    if (onError) onError(err);
  }
};
