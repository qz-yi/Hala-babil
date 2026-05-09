// Web stub for react-native-view-shot
import React from "react";
import { View } from "react-native";

export const captureRef = async () => "";
export const captureScreen = async () => "";
export const releaseCapture = () => {};

const ViewShot = React.forwardRef(({ children, style, ...rest }, ref) =>
  React.createElement(View, { style, ...rest, ref }, children)
);
ViewShot.displayName = "ViewShot";

export default ViewShot;
