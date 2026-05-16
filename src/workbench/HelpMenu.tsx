/**
 * (c) 2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  ThemeTypings,
  ThemingProps,
  useDisclosure,
} from "@chakra-ui/react";
import { useRef } from "react";
import {
  RiExternalLinkLine,
  RiInformationLine,
  RiQuestionLine,
  RiVideoLine,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { zIndexAboveTerminal } from "../common/zIndex";
import { deployment } from "../deployment";
import AboutDialog from "./AboutDialog/AboutDialog";
import WelcomeDialog from "./WelcomeDialog";

interface HelpMenuProps extends ThemingProps<"Menu"> {
  size?: ThemeTypings["components"]["Button"]["sizes"];
}

/**
 * A help button that triggers a drop-down menu with actions.
 */
const HelpMenu = ({ size, ...props }: HelpMenuProps) => {
  const aboutDialogDisclosure = useDisclosure();
  const welcomeDialogDisclosure = useDisclosure();
  const intl = useIntl();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <AboutDialog
        isOpen={aboutDialogDisclosure.isOpen}
        onClose={aboutDialogDisclosure.onClose}
        finalFocusRef={menuButtonRef}
      />
      {welcomeDialogDisclosure.isOpen && (
        <WelcomeDialog
          isOpen
          onClose={welcomeDialogDisclosure.onClose}
        />
      )}
      <Menu {...props}>
        <MenuButton
          ref={menuButtonRef}
          as={IconButton}
          aria-label={intl.formatMessage({ id: "help" })}
          size={size}
          fontSize="xl"
          variant="sidebar"
          icon={<RiQuestionLine />}
          colorScheme="gray"
          isRound
        />
        <Portal>
          <MenuList zIndex={zIndexAboveTerminal}>
            {deployment.supportLink && (
              <MenuItem
                as="a"
                href={deployment.supportLink}
                target="_blank"
                rel="noopener"
                icon={<RiExternalLinkLine />}
              >
                <FormattedMessage id="help-support" />
              </MenuItem>
            )}
            <MenuItem
              as="a"
              href="https://calliope.cc/programmieren/editoren/python"
              target="_blank"
              rel="noopener"
              icon={<RiExternalLinkLine />}
            >
              <FormattedMessage id="micropython-documentation" />
            </MenuItem>
            <MenuItem
              icon={<RiVideoLine />}
              onClick={welcomeDialogDisclosure.onOpen}
            >
              <FormattedMessage id="welcome-title" />
            </MenuItem>
            <MenuDivider />
            {deployment.termsOfUseLink && (
              <MenuItem
                as="a"
                href={deployment.termsOfUseLink}
                target="_blank"
                rel="noopener"
                icon={<RiExternalLinkLine />}
              >
                <FormattedMessage id="terms-of-use" />
              </MenuItem>
            )}
            {deployment.dataProtectionLink && (
              <MenuItem
                as="a"
                href={deployment.dataProtectionLink}
                target="_blank"
                rel="noopener"
                icon={<RiExternalLinkLine />}
              >
                <FormattedMessage id="data-protection" />
              </MenuItem>
            )}
            {deployment.imprintLink && (
              <MenuItem
                as="a"
                href={deployment.imprintLink}
                target="_blank"
                rel="noopener"
                icon={<RiExternalLinkLine />}
              >
                <FormattedMessage id="imprint" />
              </MenuItem>
            )}
            <MenuDivider />
            <MenuItem
              icon={<RiInformationLine />}
              onClick={aboutDialogDisclosure.onOpen}
            >
              <FormattedMessage id="about" />
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </>
  );
};

export default HelpMenu;
