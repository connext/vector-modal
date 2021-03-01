/// TODO: Adapt Chakra ModalHeader

// var ModalHeader = /*#__PURE__*/(0, _system.forwardRef)(function (props, ref) {
//   var className = props.className,
//       rest = _objectWithoutPropertiesLoose(props, ["className"]);

//   var _useModalContext5 = useModalContext(),
//       headerId = _useModalContext5.headerId,
//       setHeaderMounted = _useModalContext5.setHeaderMounted;
//   /**
//    * Notify us if this component was rendered or used
//    * so we can append `aria-labelledby` automatically
//    */


//   React.useEffect(function () {
//     setHeaderMounted(true);
//     return function () {
//       return setHeaderMounted(false);
//     };
//   }, [setHeaderMounted]);

//   var _className = (0, _utils.cx)("chakra-modal__header", className);

//   var styles = (0, _system.useStyles)();

//   var headerStyles = _extends({
//     flex: 0
//   }, styles.header);

//   return /*#__PURE__*/React.createElement(_system.chakra.header, _extends({
//     ref: ref,
//     className: _className,
//     id: headerId
//   }, rest, {
//     __css: headerStyles
//   }));
// });
// exports.ModalHeader = ModalHeader;

// if (_utils.__DEV__) {
//   ModalHeader.displayName = "ModalHeader";
// }
