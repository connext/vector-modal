/// TODO: Adapt Chakra Button
/// May want to make a general purpose button, and then subclass for specific types, i.e. one for back button,
/// one for hamburger dropdown menu, one with text/linking, etc.

// var Button = /*#__PURE__*/(0, _system.forwardRef)(function (props, ref) {
//   var _styles$_focus;

//   var group = (0, _buttonGroup.useButtonGroup)();
//   var styles = (0, _system.useStyleConfig)("Button", _extends({}, group, props));

//   var _omitThemingProps = (0, _system.omitThemingProps)(props),
//       _omitThemingProps$isD = _omitThemingProps.isDisabled,
//       isDisabled = _omitThemingProps$isD === void 0 ? group == null ? void 0 : group.isDisabled : _omitThemingProps$isD,
//       isLoading = _omitThemingProps.isLoading,
//       isActive = _omitThemingProps.isActive,
//       isFullWidth = _omitThemingProps.isFullWidth,
//       children = _omitThemingProps.children,
//       leftIcon = _omitThemingProps.leftIcon,
//       rightIcon = _omitThemingProps.rightIcon,
//       loadingText = _omitThemingProps.loadingText,
//       _omitThemingProps$ico = _omitThemingProps.iconSpacing,
//       iconSpacing = _omitThemingProps$ico === void 0 ? "0.5rem" : _omitThemingProps$ico,
//       _omitThemingProps$typ = _omitThemingProps.type,
//       type = _omitThemingProps$typ === void 0 ? "button" : _omitThemingProps$typ,
//       spinner = _omitThemingProps.spinner,
//       className = _omitThemingProps.className,
//       as = _omitThemingProps.as,
//       rest = _objectWithoutPropertiesLoose(_omitThemingProps, ["isDisabled", "isLoading", "isActive", "isFullWidth", "children", "leftIcon", "rightIcon", "loadingText", "iconSpacing", "type", "spinner", "className", "as"]);
//   /**
//    * When button is used within ButtonGroup (i.e flushed with sibling buttons),
//    * it is important to add a `zIndex` on focus.
//    *
//    * So let's read the component styles and then add `zIndex` to it.
//    */


//   var _focus = (0, _utils.mergeWith)({}, (_styles$_focus = styles == null ? void 0 : styles["_focus"]) != null ? _styles$_focus : {}, {
//     zIndex: 1
//   });

//   var buttonStyles = _extends({
//     display: "inline-flex",
//     appearance: "none",
//     alignItems: "center",
//     justifyContent: "center",
//     transition: "all 250ms",
//     userSelect: "none",
//     position: "relative",
//     whiteSpace: "nowrap",
//     verticalAlign: "middle",
//     outline: "none",
//     width: isFullWidth ? "100%" : "auto"
//   }, styles, !!group && {
//     _focus: _focus
//   });

//   return /*#__PURE__*/React.createElement(_system.chakra.button, _extends({
//     disabled: isDisabled || isLoading,
//     ref: ref,
//     as: as,
//     type: as ? undefined : type,
//     "data-active": (0, _utils.dataAttr)(isActive),
//     "data-loading": (0, _utils.dataAttr)(isLoading),
//     __css: buttonStyles,
//     className: (0, _utils.cx)("chakra-button", className)
//   }, rest), leftIcon && !isLoading && /*#__PURE__*/React.createElement(ButtonIcon, {
//     marginEnd: iconSpacing
//   }, leftIcon), isLoading && /*#__PURE__*/React.createElement(ButtonSpinner, {
//     __css: {
//       fontSize: "1em",
//       lineHeight: "normal"
//     },
//     spacing: iconSpacing,
//     label: loadingText
//   }, spinner), isLoading ? loadingText || /*#__PURE__*/React.createElement(_system.chakra.span, {
//     opacity: 0
//   }, children) : children, rightIcon && !isLoading && /*#__PURE__*/React.createElement(ButtonIcon, {
//     marginStart: iconSpacing
//   }, rightIcon));
// });
// exports.Button = Button;

// if (_utils.__DEV__) {
//   Button.displayName = "Button";
// }

// var ButtonIcon = function ButtonIcon(props) {
//   var children = props.children,
//       className = props.className,
//       rest = _objectWithoutPropertiesLoose(props, ["children", "className"]);

//   var _children = /*#__PURE__*/React.isValidElement(children) ? /*#__PURE__*/React.cloneElement(children, {
//     "aria-hidden": true,
//     focusable: false
//   }) : children;

//   var _className = (0, _utils.cx)("chakra-button__icon", className);

//   return /*#__PURE__*/React.createElement(_system.chakra.span, _extends({}, rest, {
//     className: _className
//   }), _children);
// };

// if (_utils.__DEV__) {
//   ButtonIcon.displayName = "ButtonIcon";
// }