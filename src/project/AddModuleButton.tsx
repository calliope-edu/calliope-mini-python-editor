/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Tooltip } from "@chakra-ui/tooltip";
import { RiFileAddLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import CollapsibleButton, {
  CollapsibleButtonComposableProps,
} from "../common/CollapsibleButton";
import { useProjectActions } from "./project-hooks";

interface AddModuleButtonProps extends CollapsibleButtonComposableProps {}

/**
 * This opens a dialog where the user can select a module to add to the project.
 */
const AddModuleButton = (props: AddModuleButtonProps) => {
  const actions = useProjectActions();
  const intl = useIntl();
  return (
    <Tooltip
      hasArrow
      label={intl.formatMessage({
        id: "add-module",
      })}
    >
      <CollapsibleButton
        {...props}
        text={intl.formatMessage({
          id: "add-module-action",
        })}
        onClick={actions.addModule}
        icon={<RiFileAddLine />}
      />
    </Tooltip>
  );
};

export default AddModuleButton;
