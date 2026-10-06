from djangorestframework_camel_case.util import camelize_re, underscore_to_camel


def camelize_query_parameters(result, generator, request, public):
    """Document query parameters in camelCase, matching what CamelCaseMiddleWare accepts."""
    for path in result.get("paths", {}).values():
        for operation in path.values():
            for parameter in operation.get("parameters", []):
                if parameter.get("in") == "query":
                    parameter["name"] = camelize_re.sub(underscore_to_camel, parameter["name"])
    return result
