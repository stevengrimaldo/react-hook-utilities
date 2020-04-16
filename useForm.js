// @flow
import { useEffect, useState } from 'react';
import { loadReCaptcha } from 'recaptcha-v3-react';
import axios from 'axios';
import { sendAnalytics } from '../utils';

/**
 * Returns all the necessary functions and handlers for all the currently available for field types and options
 */
type CheckBoxType = {
  value: string,
  isChecked: boolean
};

type OptionType = {
  label: string,
  selected: boolean,
  value: string
};

type FieldType = {
  autocomplete?: string,
  checkboxes?: CheckBoxType[],
  checked?: boolean,
  defaultText?: string,
  isRequired?: boolean,
  label: string,
  maxLength?: number,
  minLength?: number,
  name: string,
  onChange: Function,
  options?: OptionType[],
  pattern?: string,
  placeholder?: string,
  touched: boolean,
  type:
    | 'checkboxgroup'
    | 'date'
    | 'email'
    | 'password'
    | 'tel'
    | 'text'
    | 'number'
    | 'textarea'
    | 'select',
  valid: boolean,
  value: string
};

type FormData = {
  action: string,
  fields: FieldType[],
  method: string,
  name: string,
  pardot?: boolean
};

type FormType = {
  form: FormData,
  nodeId: number,
  recaptchaSiteKey: string
};

const formStatus = {
  default: 'DEFAULT',
  error: 'ERROR',
  pending: 'PENDING',
  success: 'SUCCESS'
};

const useForm = ({ form, nodeId, recaptchaSiteKey }: FormType) => {
  const initialData = {};
  const initialTouched = {};
  const initialValid = {};

  form.fields.forEach((field, i) => {
    const isSelect = field.type === 'select';
    const isCheckbox = field.type === 'checkboxgroup';
    let initialValue = '';

    if (isSelect) {
      if (field.defaultText !== '') {
        if (
          field.options &&
          field.options.filter(option => option.selected === true)[0]
        ) {
          initialValue = field.options.filter(
            option => option.selected === true
          )[0].value;
        } else {
          initialValue = '';
        }
      } else {
        if (
          field.options &&
          field.options.filter(option => option.selected === true)[0]
        ) {
          initialValue = field.options.filter(
            option => option.selected === true
          )[0].value;
        } else if (field.options) {
          initialValue = field.options[0].value;
        }
      }
    } else if (isCheckbox) {
      initialValue = field.checkboxes;
    }

    initialData[field.name] = initialValue;
    initialTouched[field.name] = isSelect
      ? isSelect && initialValue !== ''
      : initialValue !== '';
    initialValid[field.name] = isSelect
      ? isSelect && initialValue !== ''
      : initialValue !== '';
  });

  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [status, setStatus] = useState(formStatus.default);
  const [data, setData] = useState(initialData);
  const [touched, setTouched] = useState(initialTouched);
  const [valid, setValid] = useState(initialValid);

  const handleChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const value = target.value;
    const name = target.name;
    const valid = target.validity.valid;
    const isCheckbox = target.type === 'checkbox';
    const isRequired = target.hasAttribute('required');

    let isValid = valid;
    let newValue = value;
    let newName = name;

    if (isCheckbox) {
      newName = target.name.replace(/[0-9]/g, '');
      newValue = data[newName].map(c =>
        value === c.value
          ? {
              isChecked: target.checked,
              value: c.value
            }
          : c
      );

      if (isRequired) {
        isValid = isValid = newValue.some(v => v.isChecked === true);
      }
    } else {
      if (isRequired) {
        isValid = valid && newValue !== '';
      }
    }

    setData(prevData => ({
      ...prevData,
      [newName]: newValue
    }));
    setTouched(prevTouched => ({
      ...prevTouched,
      [newName]: true
    }));
    setValid(prevValid => ({
      ...prevValid,
      [newName]: isValid
    }));
  };

  const resetHandler = () => {
    setStatus(formStatus.default);
    setData(initialData);
    setTouched(initialTouched);
    setValid(initialValid);
  };

  const submitAnalytics = (error?: string) => {
    sendAnalytics({
      action: 'Form Submit',
      category: 'Form',
      event: 'page.formSubmit',
      gtag: true,
      label: form.name,
      'page.formSubmit': {
        complete: !error,
        data,
        error: error || '',
        name: form.name,
        type: 'dynamic',
        v: 3
      }
    });
  };

  const errorHandler = (error: string) => {
    setStatus(formStatus.error);
    submitAnalytics(error);
  };

  const successHandler = () => {
    setStatus(formStatus.success);
    submitAnalytics();
  };

  const responseHandler = (response: Object) => {
    if (response.data.Status === 'Failure') {
      errorHandler(response.data.Message);
    } else {
      successHandler();
    }
  };

  const submitHandler = (e: SyntheticEvent<>) => {
    const isValid = Object.values(valid).every(v => v);

    if (isValid) {
      setStatus(formStatus.pending);

      if (!form.method) {
        e.preventDefault();

        axios
          .post(form.action, {
            formData: data,
            formName: form.name,
            nodeId: nodeId,
            token: recaptchaToken
          })
          .then(responseHandler)
          .catch(errorHandler);
      }
    } else {
      e.preventDefault();

      setTouched(prevTouched =>
        Object.keys(prevTouched).reduce(
          (total, k) => ({ ...total, [k]: true }),
          {}
        )
      );
    }
  };

  const verifyCallback = (recaptchaToken: string) => {
    setRecaptchaToken(recaptchaToken);
  };

  useEffect(() => {
    loadReCaptcha({
      id: form.name,
      key: recaptchaSiteKey
    });
  }, [form.name, recaptchaSiteKey]);

  return {
    data,
    formStatus,
    handleChange,
    resetHandler,
    status,
    submitHandler,
    touched,
    valid,
    verifyCallback
  };
};

export default useForm;
