"""ROS 2 Int32 template: /number -> checked doubling -> /double.

REPLACE: message type, topics, QoS, transform(), and callback fields.
Run inside the provided ROS environment: python3 processor.py
"""
import rclpy
from rclpy.node import Node
from rclpy.qos import DurabilityPolicy, QoSProfile, ReliabilityPolicy
from std_msgs.msg import Int32


INPUT_TOPIC = "/number"
OUTPUT_TOPIC = "/double"


def transform(value):
    result = value * 2
    if not -(1 << 31) <= result < (1 << 31):
        raise ValueError("doubled result is outside int32")
    return result


class Processor(Node):
    def __init__(self):
        super().__init__("exam_processor")
        qos = QoSProfile(
            depth=10,
            reliability=ReliabilityPolicy.RELIABLE,
            durability=DurabilityPolicy.VOLATILE,
        )
        self.pub = self.create_publisher(Int32, OUTPUT_TOPIC, qos)
        self.sub = self.create_subscription(Int32, INPUT_TOPIC, self.on_msg, qos)

    def on_msg(self, received):
        try:
            result = transform(received.data)
        except ValueError as error:
            # Template policy: log and reject; replace with the exam's policy.
            self.get_logger().error(str(error))
            return
        out = Int32()
        out.data = result
        self.pub.publish(out)


def main():
    rclpy.init()
    node = Processor()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == "__main__":
    main()
