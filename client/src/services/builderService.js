import api from './api';

export const getBuilderCatalog = async () => {
  const { data } = await api.get('/builder/catalog');
  return data.data.catalog;
};

/**
 * Authoritative server quote — ignores any client-sent prices.
 */
export const quoteBuilderPizza = async (configuration) => {
  const payload = {
    size: configuration.size,
    base: configuration.base,
    sauce: configuration.sauce,
    cheese: configuration.cheese,
    vegetables: configuration.vegetables || [],
    extraCheese: Boolean(configuration.extraCheese),
    quantity: configuration.quantity || 1,
  };

  const { data } = await api.post('/builder/quote', payload);
  return data.data.quote;
};
