

// var ModalOverlay = /*#__PURE__*/(0, _system.forwardRef)(function (props, ref) {
//   var className = props.className,
//       transition = props.transition,
//       rest = _objectWithoutPropertiesLoose(props, ["className", "transition"]);

//   var _className = (0, _utils.cx)("chakra-modal__overlay", className);

//   var styles = (0, _system.useStyles)();

//   var overlayStyle = _extends({
//     pos: "fixed",
//     left: "0",
//     top: "0",
//     w: "100vw",
//     h: "100vh"
//   }, styles.overlay);

//   var _useModalContext4 = useModalContext(),
//       motionPreset = _useModalContext4.motionPreset;

//   var motionProps = motionPreset === "none" ? {} : _transition.fadeConfig;
//   return /*#__PURE__*/React.createElement(Motion, _extends({}, motionProps, {
//     __css: overlayStyle,
//     ref: ref,
//     className: _className
//   }, rest));
// });
// exports.ModalOverlay = ModalOverlay;

// if (_utils.__DEV__) {
//   ModalOverlay.displayName = "ModalOverlay";
// }