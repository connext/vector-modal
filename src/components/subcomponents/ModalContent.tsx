/// TODO: Create a substitute for ModalContent component from Chakra.
/// This should also replace ModalBody - I believe the similarity/redundancy across all 'Screens' in terms of
/// UI merits that abstraction - we won't need both, as the body can just be passed into the content and injected/nested
/// here however we like.

// import React, { FC, useEffect, useState } from 'react';
// import CSS from 'csstype';

// Modal.defaultProps = {
//   lockFocusAcrossFrames: true,
//   returnFocusOnClose: true,
//   scrollBehavior: "outside",
//   trapFocus: true,
//   autoFocus: true,
//   blockScrollOnMount: true,
//   allowPinchZoom: false,
//   motionPreset: "scale"
// };

// var ModalBody = /*#__PURE__*/(0, _system.forwardRef)(function (props, ref) {
//   var className = props.className,
//       rest = _objectWithoutPropertiesLoose(props, ["className"]);

//   var _useModalContext6 = useModalContext(),
//       bodyId = _useModalContext6.bodyId,
//       setBodyMounted = _useModalContext6.setBodyMounted;
//   /**
//    * Notify us if this component was rendered or used
//    * so we can append `aria-describedby` automatically
//    */


//   React.useEffect(function () {
//     setBodyMounted(true);
//     return function () {
//       return setBodyMounted(false);
//     };
//   }, [setBodyMounted]);

//   var _className = (0, _utils.cx)("chakra-modal__body", className);

//   var styles = (0, _system.useStyles)();
//   return /*#__PURE__*/React.createElement(_system.chakra.div, _extends({
//     ref: ref,
//     className: _className,
//     id: bodyId
//   }, rest, {
//     __css: styles.body
//   }));
// });
// exports.ModalBody = ModalBody;

// if (_utils.__DEV__) {
//   ModalBody.displayName = "ModalBody";
// }


// const styleModalContent: CSS.Properties = {
//   backgroundImage: `url(${graphic})`,
//   backgroundColor: '#F5F5F5',
//   border: '2px solid #4D4D4D',
//   boxSizing: 'border-box',
//   borderRadius: '15px',
//   padding: '0.5rem',
//   backgroundRepeat: 'no-repeat',
// };

// const ModalContent: FC<TransferProps> = props => {

//   return (
//     <>

//     </>
//   )
// };