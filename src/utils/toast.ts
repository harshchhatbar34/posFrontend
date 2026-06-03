import Toast from "react-native-toast-message";

type ToastType = "success" | "error" | "info";

const show = (type: ToastType, title: string, message?: string) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
};

export const toast = {
  success: (title: string, message?: string) => show("success", title, message),
  error: (title: string, message?: string) => show("error", title, message),
  info: (title: string, message?: string) => show("info", title, message),

  /** Extracts message from a backend response or error and shows the right toast */
  fromResponse: (response: any, fallbackSuccess = "Done!") => {
    const msg = response?.data?.message || response?.message || fallbackSuccess;
    show("success", msg);
  },
  fromError: (error: any, fallback = "Something went wrong") => {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      fallback;
    show("error", msg);
  },
};
