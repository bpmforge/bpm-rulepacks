from abc import ABC, abstractmethod

class PricingStrategy(ABC):
    @abstractmethod
    def calculate_discount(self, order):
        raise NotImplementedError

def calculate_discount(order):
    return order.total * 0.1


# A base-class method that raises NotImplementedError is Python's other
# abstract-method idiom, used where ABCMeta cannot be (Django models and
# querysets). 15 of 16 saleor hits were this.
class BaseBuffer:
    def put_event(self, event):
        raise NotImplementedError("subclasses of BaseBuffer must provide put_event()")
