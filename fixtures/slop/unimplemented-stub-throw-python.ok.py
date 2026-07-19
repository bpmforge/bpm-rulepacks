from abc import ABC, abstractmethod

class PricingStrategy(ABC):
    @abstractmethod
    def calculate_discount(self, order):
        raise NotImplementedError

def calculate_discount(order):
    return order.total * 0.1
