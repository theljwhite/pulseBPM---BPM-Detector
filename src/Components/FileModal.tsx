import React from "react";
import { Box, Heading } from "grommet";
import { Button, Text, Layer } from "grommet";
import { FormClose, StatusGood, StatusCritical } from "grommet-icons";

interface ModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalMessage: string;
  isFileSubmitted: boolean;
}

export default function FileModal({
  setIsModalOpen,
  modalMessage,
  isFileSubmitted,
}: ModalProps) {
  const closeModal = (): void => {
    setIsModalOpen(false);
  };

  return (
    <React.Fragment>
      {isFileSubmitted ? (
        <Layer
          position="top"
          modal={false}
          margin={{ vertical: "medium", horizontal: "small" }}
          onEsc={closeModal}
          onClickOutside={closeModal}
          responsive={false}
          plain
        >
          <Box
            align="center"
            direction="row"
            gap="small"
            justify="between"
            round="medium"
            elevation="small"
            pad={{ vertical: "xsmall", horizontal: "small" }}
            background="status-ok"
          >
            <Box align="center" direction="row" gap="xsmall">
              <StatusGood />
              <Text>File successfully submitted!</Text>
            </Box>
            <Button plain icon={<FormClose />} onClick={closeModal} />
          </Box>
        </Layer>
      ) : (
        <Layer
          position="top"
          modal={false}
          margin={{ vertical: "medium", horizontal: "small" }}
          onEsc={closeModal}
          onClickOutside={closeModal}
          responsive={false}
          plain
        >
          <Box
            align="center"
            direction="row"
            gap="small"
            justify="between"
            round="medium"
            elevation="small"
            pad={{ vertical: "xsmall", horizontal: "small" }}
            background="status-error"
          >
            <Box align="center" direction="row" gap="xsmall">
              <StatusCritical />
              <Text>{modalMessage}</Text>
            </Box>
            <Button plain icon={<FormClose />} onClick={closeModal} />
          </Box>
        </Layer>
      )}
    </React.Fragment>
  );
}
