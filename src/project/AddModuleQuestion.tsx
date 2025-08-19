/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  FormControl,
  FormHelperText,
  FormLabel,
} from "@chakra-ui/form-control";
import { Checkbox, CheckboxGroup } from "@chakra-ui/react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { InputDialogBody } from "../common/InputDialog";

interface AddModuleQuestionProps extends InputDialogBody<string[]> {}

const AddModuleQuestion = ({
  validationResult,
  value,
  setValidationResult,
  setValue,
  validate,
}: AddModuleQuestionProps) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);

  // State für ausgewählte Module
  const [selectedModules, setSelectedModules] = useState<string[]>(value || []);

  // Wenn sich die Auswahl ändert, setze den Wert im Parent
  const handleChange = (values: string[]) => {
    setSelectedModules(values);
    setValue(values); // gibt die Liste der Namen nach außen
  };

  return (
    <FormControl id="fileName" isRequired isInvalid={false}>
      <FormLabel>
        <FormattedMessage id="add-module-text" />
      </FormLabel>
      <CheckboxGroup value={selectedModules as string[]} onChange={(v) => handleChange(v as string[])}>
        <ul style={{listStyleType: 'none', padding: '0'}}>
        {MODULE_FILE_LIST.map((module) => (
          <li key={module.name}>
            <Checkbox value={module.name} style={{ marginBottom: "10px" }}>{module.name}</Checkbox>
          </li>
        ))}
        </ul>
      </CheckboxGroup>
      <FormHelperText color="gray.700">
        <FormattedMessage
          id="new-file-hint"
          values={{
            code: (chunks: ReactNode) => <code>{chunks}</code>,
          }}
        />
      </FormHelperText>
    </FormControl>
  );
};

export default AddModuleQuestion;
