/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {extendTheme, theme, withDefaultVariant} from "@chakra-ui/react";
import {mode, transparentize} from "@chakra-ui/theme-tools";

import colors from "./colors";
import fontSizes from "./font-sizes";
import fonts from "./fonts";
import radii from "./radii";
import sizes from "./sizes";
import space from "./space";

// See https://chakra-ui.com/docs/theming/customize-theme
const overrides = {
  fonts,
  fontSizes,
  sizes,
  space,
  radii,
  colors,
  components: {
    "Accordion": {
      "parts": [
        "root",
        "container",
        "button",
        "panel",
        "icon"
      ],
      "baseStyle": {
        "root": {},
        "container": {
          "borderTopWidth": "1px",
          "borderColor": "inherit",
          "_last": {
            "borderBottomWidth": "1px"
          }
        },
        "button": {
          "transitionProperty": "common",
          "transitionDuration": "normal",
          "fontSize": "1rem",
          "_focus": {
            "boxShadow": "outline"
          },
          "_hover": {
            "bg": "blackAlpha.50"
          },
          "_disabled": {
            "opacity": 0.4,
            "cursor": "not-allowed"
          },
          "px": 4,
          "py": 2
        },
        "panel": {
          "pt": 2,
          "px": 4,
          "pb": 5
        },
        "icon": {
          "fontSize": "1.25em"
        }
      },
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Alert": {
      "parts": [
        "title",
        "description",
        "container",
        "icon"
      ],
      "baseStyle": {
        "container": {
          "px": 4,
          "py": 3
        },
        "title": {
          "fontWeight": "bold",
          "lineHeight": 6,
          "marginEnd": 2
        },
        "description": {
          "lineHeight": 6
        },
        "icon": {
          "flexShrink": 0,
          "marginEnd": 3,
          "w": 5,
          "h": 6
        }
      },
      "variants": {},
      "defaultProps": {
        "variant": "subtle",
        "colorScheme": "brand"
      }
    },
    "Avatar": {
      "parts": [
        "label",
        "badge",
        "container",
        "excessLabel",
        "group"
      ],
      "sizes": {
        "2xs": {
          "container": {
            "width": "4",
            "height": "4",
            "fontSize": "calc(1rem / 2.5)"
          },
          "excessLabel": {
            "width": "4",
            "height": "4"
          },
          "label": {
            "fontSize": "calc(1rem / 2.5)",
            "lineHeight": "1rem"
          }
        },
        "xs": {
          "container": {
            "width": "6",
            "height": "6",
            "fontSize": "calc(1.5rem / 2.5)"
          },
          "excessLabel": {
            "width": "6",
            "height": "6"
          },
          "label": {
            "fontSize": "calc(1.5rem / 2.5)",
            "lineHeight": "1.5rem"
          }
        },
        "sm": {
          "container": {
            "width": "8",
            "height": "8",
            "fontSize": "calc(2rem / 2.5)"
          },
          "excessLabel": {
            "width": "8",
            "height": "8"
          },
          "label": {
            "fontSize": "calc(2rem / 2.5)",
            "lineHeight": "2rem"
          }
        },
        "md": {
          "container": {
            "width": "12",
            "height": "12",
            "fontSize": "calc(3rem / 2.5)"
          },
          "excessLabel": {
            "width": "12",
            "height": "12"
          },
          "label": {
            "fontSize": "calc(3rem / 2.5)",
            "lineHeight": "3rem"
          }
        },
        "lg": {
          "container": {
            "width": "16",
            "height": "16",
            "fontSize": "calc(4rem / 2.5)"
          },
          "excessLabel": {
            "width": "16",
            "height": "16"
          },
          "label": {
            "fontSize": "calc(4rem / 2.5)",
            "lineHeight": "4rem"
          }
        },
        "xl": {
          "container": {
            "width": "24",
            "height": "24",
            "fontSize": "calc(6rem / 2.5)"
          },
          "excessLabel": {
            "width": "24",
            "height": "24"
          },
          "label": {
            "fontSize": "calc(6rem / 2.5)",
            "lineHeight": "6rem"
          }
        },
        "2xl": {
          "container": {
            "width": "32",
            "height": "32",
            "fontSize": "calc(8rem / 2.5)"
          },
          "excessLabel": {
            "width": "32",
            "height": "32"
          },
          "label": {
            "fontSize": "calc(8rem / 2.5)",
            "lineHeight": "8rem"
          }
        },
        "full": {
          "container": {
            "width": "100%",
            "height": "100%",
            "fontSize": "calc(100% / 2.5)"
          },
          "excessLabel": {
            "width": "100%",
            "height": "100%"
          },
          "label": {
            "fontSize": "calc(100% / 2.5)"
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Badge": {
      "baseStyle": {
        "px": 1,
        "textTransform": "uppercase",
        "fontSize": "xs",
        "borderRadius": "sm",
        "fontWeight": "bold"
      },
      "variants": {},
      "defaultProps": {
        "variant": "subtle",
        "colorScheme": "brand"
      }
    },
    "Breadcrumb": {
      "parts": [
        "link",
        "item",
        "container",
        "separator"
      ],
      "baseStyle": {
        "link": {
          "transitionProperty": "common",
          "transitionDuration": "fast",
          "transitionTimingFunction": "ease-out",
          "cursor": "pointer",
          "textDecoration": "none",
          "outline": "none",
          "color": "inherit",
          "_hover": {
            "textDecoration": "underline"
          },
          "_focus": {
            "boxShadow": "outline"
          }
        }
      },
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Button": {
      "baseStyle": {
        "lineHeight": "1.2",
        "borderRadius": "button",
        "fontWeight": "semibold",
        "transitionProperty": "common",
        "transitionDuration": "normal",
        "_focus": {
          "boxShadow": "outline"
        },
        "_disabled": {
          "opacity": 0.4,
          "cursor": "not-allowed",
          "boxShadow": "none"
        },
        "_hover": {
          "_disabled": {
            "bg": "initial"
          }
        }
      },
      "variants": {
        "unstyled": {
          "bg": "none",
          "color": "inherit",
          "display": "inline",
          "lineHeight": "inherit",
          "m": 0,
          "p": 0,
          "borderRadius": "unset"
        },
        "ghost": (props: any) => {
          const c = props.colorScheme,
              theme = props.theme;

          if (c === "gray") {
            return {
              color: mode("inherit", "whiteAlpha.900")(props),
              _hover: {
                bg: mode("gray.100", "whiteAlpha.200")(props)
              },
              _active: {
                bg: mode("gray.200", "whiteAlpha.300")(props)
              }
            };
          }

          var darkHoverBg = transparentize(c + ".200", 0.12)(theme);
          var darkActiveBg = transparentize(c + ".200", 0.24)(theme);
          return {
            color: mode(c + ".600", c + ".200")(props),
            bg: "transparent",
            _hover: {
              bg: mode(c + ".50", darkHoverBg)(props)
            },
            _active: {
              bg: mode(c + ".100", darkActiveBg)(props)
            }
          };
        }
      },
      "sizes": {
        "lg": {
          "h": 12,
          "minW": 12,
          "fontSize": "lg",
          "px": 6
        },
        "md": {
          "h": 10,
          "minW": 10,
          "fontSize": "md",
          "px": 4
        },
        "sm": {
          "h": 8,
          "minW": 8,
          "fontSize": "sm",
          "px": 3
        },
        "xs": {
          "h": 6,
          "minW": 6,
          "fontSize": "xs",
          "px": 2
        }
      },
      "defaultProps": {
        "variant": "outline",
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Checkbox": {
      "parts": [
        "control",
        "icon",
        "container",
        "label"
      ],
      "sizes": {
        "sm": {
          "control": {
            "h": 3,
            "w": 3
          },
          "label": {
            "fontSize": "sm"
          },
          "icon": {
            "fontSize": "0.45rem"
          }
        },
        "md": {
          "control": {
            "w": 4,
            "h": 4
          },
          "label": {
            "fontSize": "md"
          },
          "icon": {
            "fontSize": "0.625rem"
          }
        },
        "lg": {
          "control": {
            "w": 5,
            "h": 5
          },
          "label": {
            "fontSize": "lg"
          },
          "icon": {
            "fontSize": "0.625rem"
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "CloseButton": {
      "sizes": {
        "lg": {
          "--close-button-size": "40px",
          "fontSize": "16px"
        },
        "md": {
          "--close-button-size": "32px",
          "fontSize": "12px"
        },
        "sm": {
          "--close-button-size": "24px",
          "fontSize": "10px"
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Code": {
      "baseStyle": {
        "fontFamily": "mono",
        "fontSize": "sm",
        "px": "0.2em",
        "borderRadius": "sm"
      },
      "variants": {},
      "defaultProps": {
        "variant": "subtle",
        "colorScheme": "brand"
      }
    },
    "Container": {
      "baseStyle": {
        "w": "100%",
        "mx": "auto",
        "maxW": "60ch",
        "px": "1rem"
      },
      "variants": {
        "sidebar-header": {
          "bg": "gray.900",
          "p": 0,
          "maxW": "unset"
        }
      },
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Divider": {
      "baseStyle": {
        "opacity": 0.6,
        "borderColor": "inherit"
      },
      "variants": {
        "solid": {
          "borderStyle": "solid"
        },
        "dashed": {
          "borderStyle": "dashed"
        }
      },
      "defaultProps": {
        "variant": "solid",
        "colorScheme": "brand"
      }
    },
    "Drawer": {
      "parts": [
        "overlay",
        "dialogContainer",
        "dialog",
        "header",
        "closeButton",
        "body",
        "footer"
      ],
      "sizes": {
        "xs": {
          "dialog": {
            "maxW": "xs"
          }
        },
        "sm": {
          "dialog": {
            "maxW": "md"
          }
        },
        "md": {
          "dialog": {
            "maxW": "lg"
          }
        },
        "lg": {
          "dialog": {
            "maxW": "2xl"
          }
        },
        "xl": {
          "dialog": {
            "maxW": "4xl"
          }
        },
        "full": {
          "dialog": {
            "maxW": "100vw",
            "h": "100vh"
          }
        }
      },
      "defaultProps": {
        "size": "xs",
        "colorScheme": "brand"
      }
    },
    "Editable": {
      "parts": [
        "preview",
        "input",
        "textarea"
      ],
      "baseStyle": {
        "preview": {
          "borderRadius": "md",
          "py": "3px",
          "transitionProperty": "common",
          "transitionDuration": "normal"
        },
        "input": {
          "borderRadius": "md",
          "py": "3px",
          "transitionProperty": "common",
          "transitionDuration": "normal",
          "width": "full",
          "_focus": {
            "boxShadow": "outline"
          },
          "_placeholder": {
            "opacity": 0.6
          }
        },
        "textarea": {
          "borderRadius": "md",
          "py": "3px",
          "transitionProperty": "common",
          "transitionDuration": "normal",
          "width": "full",
          "_focus": {
            "boxShadow": "outline"
          },
          "_placeholder": {
            "opacity": 0.6
          }
        }
      },
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Form": {
      "parts": [
        "container",
        "requiredIndicator",
        "helperText"
      ],
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "FormError": {
      "parts": [
        "text",
        "icon"
      ],
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "FormLabel": {
      "baseStyle": {
        "fontSize": "md",
        "marginEnd": 3,
        "mb": 2,
        "fontWeight": "medium",
        "transitionProperty": "common",
        "transitionDuration": "normal",
        "opacity": 1,
        "_disabled": {
          "opacity": 0.4
        }
      },
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Heading": {
      "baseStyle": {
        "fontFamily": "heading",
        "fontWeight": "bold"
      },
      "sizes": {
        "4xl": {
          "fontSize": [
            "6xl",
            null,
            "7xl"
          ],
          "lineHeight": 1
        },
        "3xl": {
          "fontSize": [
            "5xl",
            null,
            "6xl"
          ],
          "lineHeight": 1
        },
        "2xl": {
          "fontSize": [
            "4xl",
            null,
            "5xl"
          ],
          "lineHeight": [
            1.2,
            null,
            1
          ]
        },
        "xl": {
          "fontSize": [
            "3xl",
            null,
            "4xl"
          ],
          "lineHeight": [
            1.33,
            null,
            1.2
          ]
        },
        "lg": {
          "fontSize": [
            "2xl",
            null,
            "3xl"
          ],
          "lineHeight": [
            1.33,
            null,
            1.2
          ]
        },
        "md": {
          "fontSize": "xl",
          "lineHeight": 1.2
        },
        "sm": {
          "fontSize": "md",
          "lineHeight": 1.2
        },
        "xs": {
          "fontSize": "sm",
          "lineHeight": 1.2
        }
      },
      "defaultProps": {
        "size": "xl",
        "colorScheme": "green"
      }
    },
    "Input": {
      "parts": [
        "addon",
        "field",
        "element"
      ],
      "baseStyle": {
        "field": {
          "width": "100%",
          "minWidth": 0,
          "outline": 0,
          "position": "relative",
          "appearance": "none",
          "transitionProperty": "common",
          "transitionDuration": "normal"
        }
      },
      "sizes": {
        "lg": {
          "field": {
            "fontSize": "lg",
            "px": 4,
            "h": 12,
            "borderRadius": "md"
          },
          "addon": {
            "fontSize": "lg",
            "px": 4,
            "h": 12,
            "borderRadius": "md"
          }
        },
        "md": {
          "field": {
            "fontSize": "md",
            "px": 4,
            "h": 10,
            "borderRadius": "md"
          },
          "addon": {
            "fontSize": "md",
            "px": 4,
            "h": 10,
            "borderRadius": "md"
          }
        },
        "sm": {
          "field": {
            "fontSize": "sm",
            "px": 3,
            "h": 8,
            "borderRadius": "sm"
          },
          "addon": {
            "fontSize": "sm",
            "px": 3,
            "h": 8,
            "borderRadius": "sm"
          }
        },
        "xs": {
          "field": {
            "fontSize": "xs",
            "px": 2,
            "h": 6,
            "borderRadius": "sm"
          },
          "addon": {
            "fontSize": "xs",
            "px": 2,
            "h": 6,
            "borderRadius": "sm"
          }
        }
      },
      "variants": {
        "unstyled": {
          "field": {
            "bg": "transparent",
            "px": 0,
            "height": "auto"
          },
          "addon": {
            "bg": "transparent",
            "px": 0,
            "height": "auto"
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "variant": "outline",
        "colorScheme": "brand"
      }
    },
    "Kbd": {
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Link": {
      "baseStyle": {
        "transitionProperty": "common",
        "transitionDuration": "fast",
        "transitionTimingFunction": "ease-out",
        "cursor": "pointer",
        "textDecoration": "none",
        "outline": "none",
        "color": "inherit",
        "_hover": {
          "textDecoration": "underline"
        },
        "_focus": {
          "boxShadow": "outline"
        }
      },
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "List": {
      "parts": [
        "container",
        "item",
        "icon"
      ],
      "baseStyle": {
        "container": {},
        "item": {},
        "icon": {
          "marginEnd": "0.5rem",
          "display": "inline",
          "verticalAlign": "text-bottom"
        }
      },
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Menu": {
      "parts": [
        "button",
        "list",
        "item",
        "groupTitle",
        "command",
        "divider"
      ],
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Modal": {
      "parts": [
        "overlay",
        "dialogContainer",
        "dialog",
        "header",
        "closeButton",
        "body",
        "footer"
      ],
      "sizes": {
        "xs": {
          "dialog": {
            "maxW": "xs"
          }
        },
        "sm": {
          "dialog": {
            "maxW": "sm"
          }
        },
        "md": {
          "dialog": {
            "maxW": "md"
          }
        },
        "lg": {
          "dialog": {
            "maxW": "lg"
          }
        },
        "xl": {
          "dialog": {
            "maxW": "xl"
          }
        },
        "2xl": {
          "dialog": {
            "maxW": "2xl"
          }
        },
        "3xl": {
          "dialog": {
            "maxW": "3xl"
          }
        },
        "4xl": {
          "dialog": {
            "maxW": "4xl"
          }
        },
        "5xl": {
          "dialog": {
            "maxW": "5xl"
          }
        },
        "6xl": {
          "dialog": {
            "maxW": "6xl"
          }
        },
        "full": {
          "dialog": {
            "maxW": "100vw",
            "minH": "100vh",
            "@supports(min-height: -webkit-fill-available)": {
              "minH": "-webkit-fill-available"
            },
            "my": 0
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "NumberInput": {
      "parts": [
        "root",
        "field",
        "stepperGroup",
        "stepper"
      ],
      "sizes": {
        "xs": {
          "field": {
            "fontSize": "xs",
            "px": 2,
            "h": 6,
            "borderRadius": "sm",
            "paddingInlineEnd": "var(--number-input-input-padding)",
            "verticalAlign": "top"
          },
          "stepper": {
            "fontSize": "calc(0.75rem * 0.75)",
            "_first": {
              "borderTopEndRadius": "sm"
            },
            "_last": {
              "borderBottomEndRadius": "sm",
              "mt": "-1px",
              "borderTopWidth": 1
            }
          }
        },
        "sm": {
          "field": {
            "fontSize": "sm",
            "px": 3,
            "h": 8,
            "borderRadius": "sm",
            "paddingInlineEnd": "var(--number-input-input-padding)",
            "verticalAlign": "top"
          },
          "stepper": {
            "fontSize": "calc(0.875rem * 0.75)",
            "_first": {
              "borderTopEndRadius": "sm"
            },
            "_last": {
              "borderBottomEndRadius": "sm",
              "mt": "-1px",
              "borderTopWidth": 1
            }
          }
        },
        "md": {
          "field": {
            "fontSize": "md",
            "px": 4,
            "h": 10,
            "borderRadius": "md",
            "paddingInlineEnd": "var(--number-input-input-padding)",
            "verticalAlign": "top"
          },
          "stepper": {
            "fontSize": "calc(1rem * 0.75)",
            "_first": {
              "borderTopEndRadius": "md"
            },
            "_last": {
              "borderBottomEndRadius": "md",
              "mt": "-1px",
              "borderTopWidth": 1
            }
          }
        },
        "lg": {
          "field": {
            "fontSize": "lg",
            "px": 4,
            "h": 12,
            "borderRadius": "md",
            "paddingInlineEnd": "var(--number-input-input-padding)",
            "verticalAlign": "top"
          },
          "stepper": {
            "fontSize": "calc(1.125rem * 0.75)",
            "_first": {
              "borderTopEndRadius": "md"
            },
            "_last": {
              "borderBottomEndRadius": "md",
              "mt": "-1px",
              "borderTopWidth": 1
            }
          }
        }
      },
      "variants": {
        "unstyled": {
          "field": {
            "bg": "transparent",
            "px": 0,
            "height": "auto"
          },
          "addon": {
            "bg": "transparent",
            "px": 0,
            "height": "auto"
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "variant": "outline",
        "colorScheme": "brand"
      }
    },
    "PinInput": {
      "baseStyle": {
        "width": "100%",
        "minWidth": 0,
        "outline": 0,
        "position": "relative",
        "appearance": "none",
        "transitionProperty": "common",
        "transitionDuration": "normal",
        "textAlign": "center"
      },
      "sizes": {
        "lg": {
          "fontSize": "lg",
          "w": 12,
          "h": 12,
          "borderRadius": "md"
        },
        "md": {
          "fontSize": "md",
          "w": 10,
          "h": 10,
          "borderRadius": "md"
        },
        "sm": {
          "fontSize": "sm",
          "w": 8,
          "h": 8,
          "borderRadius": "sm"
        },
        "xs": {
          "fontSize": "xs",
          "w": 6,
          "h": 6,
          "borderRadius": "sm"
        }
      },
      "variants": {
        "unstyled": {
          "bg": "transparent",
          "px": 0,
          "height": "auto"
        }
      },
      "defaultProps": {
        "size": "md",
        "variant": "outline",
        "colorScheme": "brand"
      }
    },
    "Popover": {
      "parts": [
        "content",
        "header",
        "body",
        "footer",
        "popper",
        "arrow",
        "closeButton"
      ],
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Progress": {
      "parts": [
        "label",
        "filledTrack",
        "track"
      ],
      "sizes": {
        "xs": {
          "track": {
            "h": "0.25rem"
          }
        },
        "sm": {
          "track": {
            "h": "0.5rem"
          }
        },
        "md": {
          "track": {
            "h": "0.75rem"
          }
        },
        "lg": {
          "track": {
            "h": "1rem"
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Radio": {
      "parts": [
        "container",
        "control",
        "label"
      ],
      "sizes": {
        "md": {
          "control": {
            "w": 4,
            "h": 4
          },
          "label": {
            "fontSize": "md"
          }
        },
        "lg": {
          "control": {
            "w": 5,
            "h": 5
          },
          "label": {
            "fontSize": "lg"
          }
        },
        "sm": {
          "control": {
            "width": 3,
            "height": 3
          },
          "label": {
            "fontSize": "sm"
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Select": {
      "parts": [
        "field",
        "icon"
      ],
      "sizes": {
        "lg": {
          "field": {
            "fontSize": "lg",
            "px": 4,
            "h": 12,
            "borderRadius": "md",
            "paddingInlineEnd": "2rem"
          },
          "addon": {
            "fontSize": "lg",
            "px": 4,
            "h": 12,
            "borderRadius": "md"
          }
        },
        "md": {
          "field": {
            "fontSize": "md",
            "px": 4,
            "h": 10,
            "borderRadius": "md",
            "paddingInlineEnd": "2rem"
          },
          "addon": {
            "fontSize": "md",
            "px": 4,
            "h": 10,
            "borderRadius": "md"
          }
        },
        "sm": {
          "field": {
            "fontSize": "sm",
            "px": 3,
            "h": 8,
            "borderRadius": "sm",
            "paddingInlineEnd": "2rem"
          },
          "addon": {
            "fontSize": "sm",
            "px": 3,
            "h": 8,
            "borderRadius": "sm"
          }
        },
        "xs": {
          "field": {
            "fontSize": "xs",
            "px": 2,
            "h": 6,
            "borderRadius": "sm",
            "paddingInlineEnd": "2rem"
          },
          "addon": {
            "fontSize": "xs",
            "px": 2,
            "h": 6,
            "borderRadius": "sm"
          },
          "icon": {
            "insetEnd": "0.25rem"
          }
        }
      },
      "variants": {
        "unstyled": {
          "field": {
            "bg": "transparent",
            "px": 0,
            "height": "auto"
          },
          "addon": {
            "bg": "transparent",
            "px": 0,
            "height": "auto"
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "variant": "outline",
        "colorScheme": "brand"
      }
    },
    "Skeleton": {
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "SkipLink": {
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Slider": {
      "parts": [
        "container",
        "track",
        "thumb",
        "filledTrack"
      ],
      "sizes": {},
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Spinner": {
      "baseStyle": {
        "width": [
          "var(--spinner-size)"
        ],
        "height": [
          "var(--spinner-size)"
        ]
      },
      "sizes": {
        "xs": {
          "--spinner-size": "0.75rem"
        },
        "sm": {
          "--spinner-size": "1rem"
        },
        "md": {
          "--spinner-size": "1.5rem"
        },
        "lg": {
          "--spinner-size": "2rem"
        },
        "xl": {
          "--spinner-size": "3rem"
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Stat": {
      "parts": [
        "container",
        "label",
        "helpText",
        "number",
        "icon"
      ],
      "baseStyle": {
        "container": {},
        "label": {
          "fontWeight": "medium"
        },
        "helpText": {
          "opacity": 0.8,
          "marginBottom": 2
        },
        "number": {
          "verticalAlign": "baseline",
          "fontWeight": "semibold"
        },
        "icon": {
          "marginEnd": 1,
          "w": "14px",
          "h": "14px",
          "verticalAlign": "middle"
        }
      },
      "sizes": {
        "md": {
          "label": {
            "fontSize": "sm"
          },
          "helpText": {
            "fontSize": "sm"
          },
          "number": {
            "fontSize": "2xl"
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Switch": {
      "parts": [
        "container",
        "track",
        "thumb"
      ],
      "sizes": {
        "sm": {
          "container": {
            "--switch-track-width": "1.375rem",
            "--switch-track-height": "0.75rem"
          }
        },
        "md": {
          "container": {
            "--switch-track-width": "1.875rem",
            "--switch-track-height": "1rem"
          }
        },
        "lg": {
          "container": {
            "--switch-track-width": "2.875rem",
            "--switch-track-height": "1.5rem"
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Table": {
      "parts": [
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "tfoot",
        "caption"
      ],
      "baseStyle": {
        "table": {
          "fontVariantNumeric": "lining-nums tabular-nums",
          "borderCollapse": "collapse",
          "width": "full"
        },
        "th": {
          "fontFamily": "heading",
          "fontWeight": "bold",
          "textTransform": "uppercase",
          "letterSpacing": "wider",
          "textAlign": "start"
        },
        "td": {
          "textAlign": "start"
        },
        "caption": {
          "mt": 4,
          "fontFamily": "heading",
          "textAlign": "center",
          "fontWeight": "medium"
        }
      },
      "variants": {
        "unstyled": {}
      },
      "sizes": {
        "sm": {
          "th": {
            "px": "4",
            "py": "1",
            "lineHeight": "4",
            "fontSize": "xs"
          },
          "td": {
            "px": "4",
            "py": "2",
            "fontSize": "sm",
            "lineHeight": "4"
          },
          "caption": {
            "px": "4",
            "py": "2",
            "fontSize": "xs"
          }
        },
        "md": {
          "th": {
            "px": "6",
            "py": "3",
            "lineHeight": "4",
            "fontSize": "xs"
          },
          "td": {
            "px": "6",
            "py": "4",
            "lineHeight": "5"
          },
          "caption": {
            "px": "6",
            "py": "2",
            "fontSize": "sm"
          }
        },
        "lg": {
          "th": {
            "px": "8",
            "py": "4",
            "lineHeight": "5",
            "fontSize": "sm"
          },
          "td": {
            "px": "8",
            "py": "5",
            "lineHeight": "6"
          },
          "caption": {
            "px": "6",
            "py": "2",
            "fontSize": "md"
          }
        }
      },
      "defaultProps": {
        "variant": "simple",
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "Tabs": {
      "parts": [
        "root",
        "tab",
        "tablist",
        "tabpanel",
        "tabpanels",
        "indicator"
      ],
      "baseStyle": {
        "tablist": {
          "background": `transparent linear-gradient(to bottom, ${colors.sidebar} 30%, ${colors.sidebar} 100%) 0% 0% no-repeat`,
        },
        "tab": {
          "transistion": "none",
          "_selected": {
            "transistion": "none",
            "bg": "gray.25",
            "color": "black",
            "borderLeftRadius": "8px",
            "marginLeft": theme.space["2"]
          },
          "marginLeft": theme.space["2"]
        }
      },
      "sizes": {
        "sm": {
          "tab": {
            "py": 1,
            "px": 4,
            "fontSize": "sm"
          }
        },
        "md": {
          "tab": {
            "fontSize": "md",
            "py": 2,
            "px": 4
          }
        },
        "lg": {
          "tab": {
            "fontSize": "lg",
            "py": 3,
            "px": 4
          }
        }
      },
      "variants": {
        "unstyled": {},
        "line": {
          "tab": {
            "bg": "gray.200",
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "variant": "line",
        "colorScheme": "brand"
      }
    },
    "Tag": {
      "parts": [
        "container",
        "label",
        "closeButton"
      ],
      "variants": {},
      "baseStyle": {
        "container": {
          "fontWeight": "medium",
          "lineHeight": 1.2,
          "outline": 0,
          "_focus": {
            "boxShadow": "outline"
          }
        },
        "label": {
          "lineHeight": 1.2,
          "overflow": "visible"
        },
        "closeButton": {
          "fontSize": "18px",
          "w": "1.25rem",
          "h": "1.25rem",
          "transitionProperty": "common",
          "transitionDuration": "normal",
          "borderRadius": "full",
          "marginStart": "0.375rem",
          "marginEnd": "-1",
          "opacity": 0.5,
          "_disabled": {
            "opacity": 0.4
          },
          "_focus": {
            "boxShadow": "outline",
            "bg": "rgba(0, 0, 0, 0.14)"
          },
          "_hover": {
            "opacity": 0.8
          },
          "_active": {
            "opacity": 1
          }
        }
      },
      "sizes": {
        "sm": {
          "container": {
            "minH": "1.25rem",
            "minW": "1.25rem",
            "fontSize": "xs",
            "px": 2,
            "borderRadius": "md"
          },
          "closeButton": {
            "marginEnd": "-2px",
            "marginStart": "0.35rem"
          }
        },
        "md": {
          "container": {
            "minH": "1.5rem",
            "minW": "1.5rem",
            "fontSize": "sm",
            "borderRadius": "md",
            "px": 2
          }
        },
        "lg": {
          "container": {
            "minH": 8,
            "minW": 8,
            "fontSize": "md",
            "borderRadius": "md",
            "px": 3
          }
        }
      },
      "defaultProps": {
        "size": "md",
        "variant": "subtle",
        "colorScheme": "brand"
      }
    },
    "Textarea": {
      "baseStyle": {
        "width": "100%",
        "minWidth": 0,
        "outline": 0,
        "position": "relative",
        "appearance": "none",
        "transitionProperty": "common",
        "transitionDuration": "normal",
        "paddingY": "8px",
        "minHeight": "80px",
        "lineHeight": "short",
        "verticalAlign": "top"
      },
      "sizes": {
        "xs": {
          "fontSize": "xs",
          "px": 2,
          "h": 6,
          "borderRadius": "sm"
        },
        "sm": {
          "fontSize": "sm",
          "px": 3,
          "h": 8,
          "borderRadius": "sm"
        },
        "md": {
          "fontSize": "md",
          "px": 4,
          "h": 10,
          "borderRadius": "md"
        },
        "lg": {
          "fontSize": "lg",
          "px": 4,
          "h": 12,
          "borderRadius": "md"
        }
      },
      "variants": {
        "unstyled": {
          "bg": "transparent",
          "px": 0,
          "height": "auto"
        }
      },
      "defaultProps": {
        "size": "md",
        "variant": "outline",
        "colorScheme": "brand"
      }
    },
    "Tooltip": {
      "defaultProps": {
        "colorScheme": "brand"
      }
    },
    "Text": {
      "sizes": {
        "sm": {
          "fontSize": "sm"
        },
        "md": {
          "fontSize": "md"
        }
      },
      "defaultProps": {
        "size": "md",
        "colorScheme": "brand"
      }
    },
    "IconButton": {
      "defaultProps": {
        "variant": "outline"
      }
    }
  },
};

export default extendTheme(
  overrides,
  withDefaultVariant({
    variant: "outline",
    components: ["Button", "IconButton"],
  })
);
